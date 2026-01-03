import { defineStore } from "pinia";
import { ref } from "vue";
import statsApi from "@/api/stats";

export const useStatsStore = defineStore("stats", () => {
  // --- State ---
  const weeklyStats = ref<any>(null); // Type this better based on API response if possible
  const rawDietStats = ref<any[]>([]);
  const rawExerciseStats = ref<any[]>([]);
  const weekRange = ref({ start: "", end: "" });

  const nutritionReview = ref<any>(null);
  const exerciseReview = ref<any>(null);

  const isLoading = ref(false);
  const isNutritionReviewLoading = ref(false);
  const isExerciseReviewLoading = ref(false);

  // --- Actions ---

  // 1. Fetch Weekly Stats
  const fetchWeeklyStats = async (date: string) => {
    isLoading.value = true;
    try {
      const res = await statsApi.getWeeklyStats(date);
      const data = res.data;
      
      weeklyStats.value = data;
      rawDietStats.value = data.dietStats || [];
      rawExerciseStats.value = data.exerciseStats || [];
      weekRange.value = {
        start: data.weekStartDate,
        end: data.weekEndDate,
      };
    } catch (error) {
      console.error("Failed to fetch weekly stats:", error);
      rawDietStats.value = [];
      rawExerciseStats.value = [];
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Nutrition Review Logic (Fetch + Poll)
  const fetchNutritionReview = async (date: string) => {
    // Check if we have data to analyze first
    const hasAnyDietData = (rawDietStats.value || []).some(
      (d: any) => Number(d.calories) > 0 || Number(d.carbs) > 0 || Number(d.protein) > 0 || Number(d.fat) > 0
    );

    if (!hasAnyDietData) {
      nutritionReview.value = null;
      isNutritionReviewLoading.value = false;
      return;
    }

    isNutritionReviewLoading.value = true;
    nutritionReview.value = null;

    try {
      const res = await statsApi.getNutritionReview(date);
      if (isNutritionReviewValid(res.data)) {
        nutritionReview.value = res.data;
        isNutritionReviewLoading.value = false;
      } else {
        // Start Polling
        await pollNutritionReview(date);
      }
    } catch (error) {
      console.warn("Initial nutrition review fetch failed, starting poll...", error);
      await pollNutritionReview(date);
    }
  };

  const isNutritionReviewValid = (review: any) => {
    if (!review || !review.evaluated) return false;

    const lastUpdateTimeStr = localStorage.getItem("LAST_MEAL_UPDATE_TIME");
    const lastUpdateDateStr = localStorage.getItem("LAST_MEAL_UPDATE_DATE");

    if (!lastUpdateTimeStr) return true;

    // Date Check
    if (lastUpdateDateStr && weekRange.value.start && weekRange.value.end) {
      if (lastUpdateDateStr < weekRange.value.start || lastUpdateDateStr > weekRange.value.end) {
        return true; // Update was for different week
      }
    }

    const lastUpdateTime = new Date(lastUpdateTimeStr).getTime();
    const generatedTime = new Date(review.generatedAt).getTime();

    return generatedTime >= lastUpdateTime;
  };

  const pollNutritionReview = async (date: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const res = await statsApi.getNutritionReview(date);
        if (isNutritionReviewValid(res.data)) {
          nutritionReview.value = res.data;
          return true;
        }
      } catch (e) {
        console.warn("Polling nutrition review failed:", e);
      }
      return false;
    };

    console.log("Starting polling for fresh nutrition review...");
    const interval = setInterval(async () => {
      attempts++;
      const success = await poll();
      if (success || attempts >= maxAttempts) {
        clearInterval(interval);
        isNutritionReviewLoading.value = false;
        if (success) {
          console.log("Fresh nutrition review fetched via polling!");
        } else {
          console.log("Nutrition Polling timed out.");
        }
      }
    }, pollInterval);
  };

  // 3. Exercise Review Logic (Fetch + Poll)
  const fetchExerciseReview = async (date: string) => {
     // Check data availability
     const hasAnyExerciseData = (rawExerciseStats.value || []).some(
      (d: any) => Number(d.durationMinutes) > 0 || Number(d.calories) > 0
    );

    if (!hasAnyExerciseData) {
      exerciseReview.value = null;
      isExerciseReviewLoading.value = false;
      return;
    }

    isExerciseReviewLoading.value = true;
    exerciseReview.value = null;

    try {
      const res = await statsApi.getExerciseReview(date);
      if (isExerciseReviewValid(res.data)) {
        exerciseReview.value = res.data;
        isExerciseReviewLoading.value = false;
      } else {
        await pollExerciseReview(date);
      }
    } catch (error) {
      console.warn("Initial exercise review fetch failed, starting poll...", error);
      await pollExerciseReview(date);
    }
  };

  const isExerciseReviewValid = (review: any) => {
    if (!review || !review.evaluated) return false;

    const lastUpdateTimeStr = localStorage.getItem("LAST_EXERCISE_UPDATE_TIME");
    const lastUpdateDateStr = localStorage.getItem("LAST_EXERCISE_UPDATE_DATE");

    if (!lastUpdateTimeStr) return true;

    if (lastUpdateDateStr && weekRange.value.start && weekRange.value.end) {
      if (lastUpdateDateStr < weekRange.value.start || lastUpdateDateStr > weekRange.value.end) {
        return true;
      }
    }

    const lastUpdateTime = new Date(lastUpdateTimeStr).getTime();
    const generatedTime = new Date(review.generatedAt).getTime();

    return generatedTime >= lastUpdateTime;
  };

  const pollExerciseReview = async (date: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const res = await statsApi.getExerciseReview(date);
        if (isExerciseReviewValid(res.data)) {
          exerciseReview.value = res.data;
          return true;
        }
      } catch (e) {
        console.warn("Polling exercise review failed:", e);
      }
      return false;
    };

    console.log("Starting polling for fresh exercise review...");
    const interval = setInterval(async () => {
      attempts++;
      const success = await poll();
      if (success || attempts >= maxAttempts) {
        clearInterval(interval);
        isExerciseReviewLoading.value = false;
        if (success) {
          console.log("Fresh exercise review fetched via polling!");
        } else {
          console.log("Exercise Polling timed out.");
        }
      }
    }, pollInterval);
  };

  return {
    weeklyStats,
    rawDietStats,
    rawExerciseStats,
    weekRange,
    nutritionReview,
    exerciseReview,
    isLoading,
    isNutritionReviewLoading,
    isExerciseReviewLoading,
    
    fetchWeeklyStats,
    fetchNutritionReview,
    fetchExerciseReview
  };
});
