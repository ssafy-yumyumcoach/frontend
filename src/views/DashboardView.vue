<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { Sparkles, Dumbbell, ChevronLeft, ChevronRight, Trophy, Activity, Clock, Utensils } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import exerciseApi, { type ExerciseRecordListItem, type ExerciseRecordDetail } from "@/api/exercise/index";
import { useDietStore } from "@/stores/diet";
import aiApi, { type MealPlanResponse } from "@/api/ai/index";
import statsApi from "@/api/stats";
import challengeApi, { type ChallengeSummary } from "@/api/challenge";
import { cn, formatDecimal } from "@/lib/utils";
import Dialog from "@/components/ui/Dialog.vue";

const router = useRouter();
const dietStore = useDietStore();

const navigateTo = (path: string) => {
  router.push(path);
};

// --- Daily Stats (Reactive for real-time updates) ---
const dailyStats = reactive({
  intakeCalories: 0,
  macros: {
    carbs: 0,
    protein: 0,
    fat: 0,
  },
  exerciseCalories: 0,
  exerciseTime: 0,
});

// --- Unified Timeline Integration ---
interface UnifiedTimelineItem {
  type: "MEAL" | "EXERCISE";
  id: number | string;
  recordIds?: number[];
  time: string; // HH:MM
  title: string;
  desc: string;
  subDesc: string;
  calories?: number;
  colorClass: string; // "emerald" | "blue" etc.
  icon: any; // Icon component
  imageUrl?: string;
  items?: Array<{
    name: string;
    amount?: number; // for Food (g)
    duration?: number; // for Exercise (min)
    calories: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  }>;
}

const timelineItems = ref<UnifiedTimelineItem[]>([]);

// --- Daily Diet Records Integration ---
interface DietRecord {
  dietId: number;
  recordedAt: string;
  mealType: string;
  items: Array<{ name: string; serveCount: number }>;
  totalCalories?: number;
}

const todayDiets = ref<DietRecord[]>([]);

// --- Daily Exercise Records Integration ---
interface DisplayExerciseRecord extends ExerciseRecordListItem {
  calories?: number;
  detail?: ExerciseRecordDetail;
}

const todayExercises = ref<DisplayExerciseRecord[]>([]);

// --- Date Navigation ---
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const currentDate = ref(getTodayDate());
const dateInputRef = ref<HTMLInputElement | null>(null);

const isToday = computed(() => currentDate.value === getTodayDate());

const formattedDate = computed(() => {
  const [year, month, day] = currentDate.value.split("-");
  return `${year}. ${month}. ${day}.`;
});

const changeDate = (days: number) => {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  currentDate.value = `${y}-${m}-${d}`;
};

const openDatePicker = () => {
  try {
    dateInputRef.value?.showPicker();
  } catch (e) {
    dateInputRef.value?.click();
  }
};

// 식단 목록을 저장할 ref (식단별로 표시용)
const displayedDiets = ref<
  Array<{
    dietId: number;
    timeSlot: string;
    timeSlotLabel: string;
    time: string; // HH:mm 형식
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    items: Array<{ name: string; amount: number; calories: number; carbs: number; protein: number; fat: number }>;
    imageUrl?: string;
  }>
>([]);

const fetchDailyDiets = async (targetDate: string) => {
  try {
    const res = await dietStore.getMyDiets(targetDate);

    // API 응답 구조에 따라 유연하게 처리
    let diets: any[] = [];
    if (Array.isArray(res)) {
      diets = res;
    } else if (res && typeof res === "object" && res.diets && Array.isArray(res.diets)) {
      diets = res.diets;
    } else {
      diets = [];
    }

    // 날짜 추출 (res가 객체면 res.date, 배열이면 targetDate 사용)
    const responseDate = typeof res === "object" && !Array.isArray(res) && res.date ? res.date : targetDate;

    // Convert to DietRecord format for compatibility
    const dietRecords: DietRecord[] = diets.map((diet: any) => {
      let items: any[] = [];
      if (diet.items !== null && diet.items !== undefined && Array.isArray(diet.items)) {
        items = diet.items;
      }
      const dateTimeForRecord = diet.date || diet.recordedAt || `${responseDate}T12:00:00`;
      return {
        dietId: diet.id || diet.dietId,
        recordedAt: dateTimeForRecord,
        mealType: diet.mealType || diet.timeSlot,
        items: items.map((item: any) => ({
          name: item?.name || "",
          serveCount: item?.amount || item?.serveCount || 0,
        })),
        totalCalories: diet.totalCalories || 0,
      };
    });

    todayDiets.value = dietRecords; // Variable name kept for minimal diff, effectively "dailyDiets"

    // 식단 목록 표시용 데이터 생성
    displayedDiets.value = await Promise.all(
      diets.map(async (diet: any) => {
        const dietId = diet.id || diet.dietId;
        const timeSlot = diet.mealType || diet.timeSlot;
        const dateTime = diet.date || diet.recordedAt || diet.createdAt;

        const cdnDomain = "https://d3sn2183nped6z.cloudfront.net/";
        let imageUrl = diet.imageUrl || diet.imgUrl || diet.image;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = `${cdnDomain}${imageUrl}`;
        }


        let items: any[] = [];
        if (diet.items !== null && diet.items !== undefined && Array.isArray(diet.items)) {
          items = diet.items;
        } else if (dietId) {
          try {
            const detail = await dietStore.getMyDietDetail(dietId);
            if (detail.items && Array.isArray(detail.items) && detail.items.length > 0) {
              items = detail.items;
            }
          } catch (e) {
            console.error(`❌ [Dashboard] dietId ${dietId} 상세 조회 실패:`, e);
          }
        }

        let timeSlotLabel = "";
        switch (timeSlot) {
          case "BREAKFAST":
            timeSlotLabel = "아침";
            break;
          case "LUNCH":
            timeSlotLabel = "점심";
            break;
          case "DINNER":
            timeSlotLabel = "저녁";
            break;
          case "SNACK":
            timeSlotLabel = "간식";
            break;
          default:
            timeSlotLabel = timeSlot || "식단";
        }

        let timeStr = "12:00";
        if (dateTime) {
          try {
            const date = new Date(dateTime);
            if (!isNaN(date.getTime())) {
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              timeStr = `${hours}:${minutes}`;
            }
          } catch (e) {
            // Fallback handled below
          }
        }

        // If still default or failed
        if (timeStr === "12:00" && !dateTime) {
          switch (timeSlot) {
            case "BREAKFAST":
              timeStr = "08:00";
              break;
            case "LUNCH":
              timeStr = "12:30";
              break;
            case "DINNER":
              timeStr = "19:00";
              break;
            case "SNACK":
              timeStr = "15:00";
              break;
          }
        }

        let totalCal = diet.totalCalories || 0;
        if (totalCal === 0 && items.length > 0) {
          totalCal = items.reduce((sum: number, item: any) => {
            const itemCal = item?.calories || 0;
            return sum + (typeof itemCal === "number" ? itemCal : 0);
          }, 0);
        }

        // 프론트엔드에서 총 칼로리 재계산 (백엔드 totalCalories 불일치 이슈 대응)
        let calculatedTotalCalories = 0;
        let calculatedTotalCarbs = 0;
        let calculatedTotalProtein = 0;
        let calculatedTotalFat = 0;

        const mappedItems = items.map((item: any) => {
          const itemName = item?.name || item?.foodName || item?.food?.name || "";

          // 개별 아이템의 실제 영양소 계산
          let realCalories = item?.calories || 0;
          let realCarbs = item?.carbs || item?.carbohydrate || 0;
          let realProtein = item?.protein || 0;
          let realFat = item?.fat || 0;

          // serveCount가 있으면 item.calories는 1인분(100g) 기준
          if (item?.serveCount) {
            realCalories = (item.calories || 0) * item.serveCount;
            // 다른 영양소도 동일하게 비례 계산 (데이터가 있다면)
            // 만약 item.carbs 등이 이미 계산된 값인지 unit 값인지 확실치 않지만,
            // serveCount 로직상 unit 값일 가능성이 높음
            realCarbs = (item.carbs || item.carbohydrate || 0) * item.serveCount;
            realProtein = (item.protein || 0) * item.serveCount;
            realFat = (item.fat || 0) * item.serveCount;
          } else if (item?.amount) {
            // 구버전: amount / 100 비율 적용?
            // 하지만 이미 백엔드에서 계산된 값을 줄 수도 있음.
            // 안전하게 기존 totalCal을 믿기보다 item들의 합을 믿기로 함
          }

          calculatedTotalCalories += realCalories;
          calculatedTotalCarbs += realCarbs;
          calculatedTotalProtein += realProtein;
          calculatedTotalFat += realFat;

          return {
            name: itemName,
            amount: item?.amount || (item?.serveCount ? item.serveCount * 100 : 0),
            calories: realCalories,
            carbs: realCarbs,
            protein: realProtein,
            fat: realFat,
          };
        });

        // 만약 아이템이 없거나 재계산된 값이 0이면 기존 totalCal 사용 (fallback)
        if (calculatedTotalCalories === 0 && totalCal > 0) {
          calculatedTotalCalories = totalCal;
          // 다른 영양소도 마찬가지...
          calculatedTotalCarbs = mappedItems.reduce((sum: number, item: any) => sum + (item.carbs || 0), 0);
          calculatedTotalProtein = mappedItems.reduce((sum: number, item: any) => sum + (item.protein || 0), 0);
          calculatedTotalFat = mappedItems.reduce((sum: number, item: any) => sum + (item.fat || 0), 0);
        }

        return {
          dietId: dietId,
          timeSlot: timeSlot,
          timeSlotLabel: timeSlotLabel,
          time: timeStr,
          totalCalories: calculatedTotalCalories,
          totalCarbs: calculatedTotalCarbs,
          totalProtein: calculatedTotalProtein,
          totalFat: calculatedTotalFat,
          items: mappedItems,
          imageUrl: imageUrl,
        };
      })
    );

    // Group by TimeSlot
    const dietTimelineItems: UnifiedTimelineItem[] = displayedDiets.value.map((diet) => {
      const desc =
        diet.items
          .map((item) => item.name)
          .filter(Boolean)
          .join(", ") || "음식 정보 없음";
      const nutritionInfo = `탄수화물 ${formatDecimal(diet.totalCarbs)}g · 단백질 ${formatDecimal(
        diet.totalProtein
      )}g · 지방 ${formatDecimal(diet.totalFat)}g`;
      const subDesc = `${formatDecimal(diet.totalCalories)} kcal · ${nutritionInfo}`;

      return {
        type: "MEAL",
        id: diet.dietId,
        recordIds: [diet.dietId],
        time: diet.time,
        title: diet.timeSlotLabel || "식단",
        desc: desc,
        subDesc: subDesc,
        calories: diet.totalCalories || 0,
        colorClass: "emerald",
        icon: Utensils,
        imageUrl: diet.imageUrl,
        items: diet.items.map((item) => ({
          name: item.name,
          amount: item.amount,
          calories: item.calories,
          carbs: item.carbs,
          protein: item.protein,
          fat: item.fat,
        })),
      };
    });

    const exerciseTimelineItems = timelineItems.value.filter((item) => item.type === "EXERCISE");
    timelineItems.value = [...dietTimelineItems, ...exerciseTimelineItems].sort((a, b) => a.time.localeCompare(b.time));


    // Update stats
    const totalCalories = displayedDiets.value.reduce((sum, d) => sum + (d.totalCalories || 0), 0);
    const totalCarbs = displayedDiets.value.reduce((sum, d) => sum + (d.totalCarbs || 0), 0);
    const totalProtein = displayedDiets.value.reduce((sum, d) => sum + (d.totalProtein || 0), 0);
    const totalFat = displayedDiets.value.reduce((sum, d) => sum + (d.totalFat || 0), 0);

    dailyStats.intakeCalories = totalCalories;
    dailyStats.macros.carbs = totalCarbs;
    dailyStats.macros.protein = totalProtein;
    dailyStats.macros.fat = totalFat;
  } catch (e) {
    console.error("❌ [Dashboard] Failed to fetch diet records", e);
    displayedDiets.value = [];
  }
};

const fetchDailyExercises = async (targetDate: string) => {
  try {
    const res = await exerciseApi.getMyExerciseRecords(targetDate);

    // Enhance details
    const enhancedRecords = await Promise.all(
      res.data.map(async (record): Promise<DisplayExerciseRecord> => {
        if (record.recordId) {
          try {
            const detailRes = await exerciseApi.getMyExerciseRecordDetail(record.recordId);
            return { ...record, calories: detailRes.data.calories, detail: detailRes.data };
          } catch (e) {
            return record;
          }
        }
        return record;
      })
    );

    todayExercises.value = enhancedRecords;

    const groupedRecords: Record<string, DisplayExerciseRecord[]> = {};

    enhancedRecords.forEach((ex) => {
      let timeStr = "00:00";
      if (ex.detail?.recordedAt && ex.detail.recordedAt.includes("T")) {
        const parts = ex.detail.recordedAt.split("T");
        if (parts.length > 1) {
          timeStr = parts[1].substring(0, 5); // HH:MM
        }
      }

      if (!groupedRecords[timeStr]) {
        groupedRecords[timeStr] = [];
      }
      groupedRecords[timeStr].push(ex);
    });

    // Convert Groups to TimelineItems
    const exerciseTimelineItems: UnifiedTimelineItem[] = Object.keys(groupedRecords).map((timeStr) => {
      const group = groupedRecords[timeStr];
      const firstItem = group[0];
      const totalGroupCalories = group.reduce((sum, r) => sum + (r.calories || 0), 0);
      const desc = group.map((r) => `${r.exerciseName} ${r.durationMinutes}분`).join(", ");
      const recordIds = group.map((r) => r.recordId).filter((id): id is number => !!id);

      return {
        type: "EXERCISE",
        id: firstItem.recordId || `group-${timeStr}`,
        recordIds: recordIds,
        time: timeStr,
        title: "운동",
        desc: desc,
        subDesc: `${formatDecimal(totalGroupCalories)} kcal 소모`,
        colorClass: "blue",
        icon: Dumbbell,
        items: group.map((r) => ({
          name: r.exerciseName,
          duration: r.durationMinutes,
          calories: r.calories || 0,
        })),
      };
    });
    
    // DietItems 처리 시 중복 발생 방지를 위해 필터링하지 않고, 새로 생성된 dietItems와 exerciseItems를 합칩니다.
    // 하지만 여기서는 flow상 dietItems가 이미 존재하는 상태에서 exercise를 fetch하는 로직이므로,
    // 기존 dietItems를 유지하고 exerciseItems만 새로 갈아끼우는 것이 맞습니다.
    const dietTimelineItems = timelineItems.value.filter((item) => item.type === "MEAL");
    timelineItems.value = [...dietTimelineItems, ...exerciseTimelineItems].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });

    // Update stats
    const totalCalories = enhancedRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    const totalTime = enhancedRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

    dailyStats.exerciseCalories = totalCalories;
    dailyStats.exerciseTime = Math.round(totalTime);
  } catch (e) {
    console.error("Failed to fetch exercise records", e);
    // Don't clear timeline here, as it might clear diet items too if not careful,
    // but usually fine as we rebuild timeline above.
    // To be safe, just clear exercise part? Actually safer to leave existing or empty.
  }
};

watch(currentDate, (newDate) => {
  fetchDailyDiets(newDate);
  fetchDailyExercises(newDate);
});

const handleDeleteDiet = async (dietId: number) => {
  if (!confirm("선택한 식단을 삭제하시겠습니까?")) return;

  try {
    await dietStore.deleteMyDiet(dietId);
    await fetchDailyDiets(currentDate.value);
    await fetchDailyExercises(currentDate.value);

    // AI 주간 영양 평가 생성 트리거 (비동기)
    localStorage.setItem("LAST_MEAL_UPDATE_TIME", new Date().toISOString());
    statsApi.generateNutritionReview({ anchorDate: currentDate.value }).catch((e) => console.warn(e));
  } catch (e) {
    console.error("Failed to delete diet", e);
    alert(dietStore.errorMessage || "식단 삭제에 실패했습니다.");
  }
};

const aiMealPlan = ref<MealPlanResponse | null>(null);
const isAiLoading = ref(false);

const loadMealPlan = async () => {
  isAiLoading.value = true;
  // AI Meal Plan usually takes a date.
  // If we want it to react to date change, we should pass currentDate.value.
  // The original code passed 'today'. Let's stick to 'today' for now unless requested otherwise,
  // as "Today's AI Recommendation" implies today.
  const today = getTodayDate();

  try {
    const res = await aiApi.getMealPlan(today);

    if (res.data && res.data.generated) {
      aiMealPlan.value = res.data;
    } else {
      const genRes = await aiApi.generateMealPlan({ targetDate: today });
      aiMealPlan.value = genRes.data;
    }
  } catch (e: any) {
    if (e.response && e.response.status === 404) {
      aiMealPlan.value = null;
    } else {
      if (import.meta.env.DEV) {
        console.warn("AI meal plan API 에러:", e);
      }
      aiMealPlan.value = null;
    }
  } finally {
    isAiLoading.value = false;
  }
};

onMounted(() => {
  fetchDailyDiets(currentDate.value);
  fetchDailyExercises(currentDate.value);
  loadMealPlan();
  fetchMyChallenges();
});

// --- Challenges (Real Data) ---
const challenges = ref<ChallengeSummary[]>([]);

const fetchMyChallenges = async () => {
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${month}`;

    const res = await challengeApi.getChallenges(currentMonth);
    const todayStr = getTodayDate();

    challenges.value = res.data.challenges.filter((c) => c.isJoined && c.startDate <= todayStr);
  } catch (e) {
    console.error("Failed to fetch challenges", e);
  }
};

const activeChallenges = computed(() => {
  return challenges.value.map((c) => {
    const today = new Date();
    const endDate = new Date(c.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: c.challengeId,
      title: c.title,
      image: c.imageUrl,
      progress: c.progressPercentage || 0,
      currentDay: c.successDays || 0,
      totalDays: c.requiredSuccessDays || 0,
      dDay: dDay,
    };
  });
});

const currentChallengeIndex = ref(0);
const currentChallenge = computed(() => activeChallenges.value[currentChallengeIndex.value]);

const prevChallenge = () => {
  if (currentChallengeIndex.value > 0) {
    currentChallengeIndex.value--;
  } else {
    currentChallengeIndex.value = activeChallenges.value.length - 1;
  }
};

const nextChallenge = () => {
  if (currentChallengeIndex.value < activeChallenges.value.length - 1) {
    currentChallengeIndex.value++;
  } else {
    currentChallengeIndex.value = 0;
  }
};

const handleDeleteExercise = async (recordIds?: number[]) => {
  if (!recordIds || recordIds.length === 0) return;
  if (!confirm("선택한 운동 기록을 모두 삭제하시겠습니까?")) return;

  try {
    const promises = recordIds.map((id) => exerciseApi.deleteMyExerciseRecord(id));
    await Promise.all(promises);
    await fetchDailyExercises(currentDate.value);

    // Trigger AI Exercise Review Generation (Fire and Forget)
    localStorage.setItem("LAST_EXERCISE_UPDATE_TIME", new Date().toISOString());
    statsApi.generateExerciseReview({ anchorDate: currentDate.value }).catch((e) => console.warn(e));
  } catch (e) {
    console.error("Failed to delete records", e);
    alert("운동 기록 삭제에 실패했습니다.");
  }
};

// --- Detail Dialog Logic ---
const selectedTimelineItem = ref<UnifiedTimelineItem | null>(null);
const isDietDialogOpen = ref(false);
const isExerciseDialogOpen = ref(false);

const openDetail = (item: UnifiedTimelineItem) => {
  selectedTimelineItem.value = item;
  if (item.type === "MEAL") {
    isDietDialogOpen.value = true;
  } else {
    isExerciseDialogOpen.value = true;
  }
};

const handleEditDetail = () => {
  if (!selectedTimelineItem.value) return;
  const item = selectedTimelineItem.value;

  if (item.type === "MEAL" && typeof item.id === "number") {
    router.push({
      path: "/meal-register",
      query: { mode: "edit", dietId: item.id },
    });
  } else if (item.type === "EXERCISE" && item.recordIds) {
    router.push({
      path: "/exercise-register",
      query: { mode: "edit", ids: item.recordIds.join(",") },
    });
  }
};

const handleDeleteDetail = async () => {
  if (!selectedTimelineItem.value) return;
  const item = selectedTimelineItem.value;

  if (item.type === "MEAL" && typeof item.id === "number") {
    await handleDeleteDiet(item.id);
    isDietDialogOpen.value = false;
  } else if (item.type === "EXERCISE" && item.recordIds) {
    await handleDeleteExercise(item.recordIds);
    isExerciseDialogOpen.value = false;
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- 상단 영역 - 오늘의 요약 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div class="flex items-center gap-2 h-8">
        <Activity class="w-5 h-5 text-zinc-400" />
        <h2 class="text-xl text-white leading-none">오늘의 요약</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-[1fr]">
        <!-- 1. 섭취 칼로리 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between h-full">
          <div class="text-zinc-400 text-base">섭취 칼로리</div>
          <div class="text-2xl text-white font-bold">
            {{ formatDecimal(dailyStats.intakeCalories) }}
            <span class="text-base text-zinc-500 font-normal">kcal</span>
          </div>
        </div>

        <!-- 2. 섭취 영양소 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between h-full">
          <div class="text-zinc-400 text-base">섭취 영양소</div>
          <div class="flex flex-col items-end gap-1">
            <div class="text-2xl text-white font-bold">
              {{ formatDecimal(dailyStats.macros.carbs + dailyStats.macros.protein + dailyStats.macros.fat) }}
              <span class="text-base text-zinc-500 font-normal">g</span>
            </div>
            <div class="text-sm text-zinc-500 font-medium">
              탄 {{ formatDecimal(dailyStats.macros.carbs) }} · 단 {{ formatDecimal(dailyStats.macros.protein) }} · 지
              {{ formatDecimal(dailyStats.macros.fat) }}
            </div>
          </div>
        </div>

        <!-- 3. 운동 소모 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between h-full">
          <div class="text-zinc-400 text-base">운동 소모</div>
          <div class="text-2xl text-white font-bold">
            {{ formatDecimal(dailyStats.exerciseCalories) }}
            <span class="text-base text-zinc-500 font-normal">kcal</span>
          </div>
        </div>

        <!-- 4. 운동 시간 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between h-full">
          <div class="text-zinc-400 text-base">운동 시간</div>
          <div class="text-2xl text-white font-bold">
            {{ dailyStats.exerciseTime }} <span class="text-base text-zinc-500 font-normal">min</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 중간 영역 - 좌: AI 식단 / 우: 챌린지 캐러셀 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 좌측: AI 추천 식단 계획 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full flex flex-col">
        <div class="flex items-center gap-2 h-8">
          <Sparkles class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl text-white leading-none">오늘의 AI 추천 식단</h2>
        </div>

        <div v-if="isAiLoading" class="flex-1 flex items-center justify-center text-zinc-500">
          식단을 생성하고 있습니다...
        </div>

        <div v-else-if="aiMealPlan" class="flex-1 flex flex-col justify-between gap-4">
          <!-- 아침 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">아침</div>
            </div>
            <div class="text-white">{{ aiMealPlan.breakfast.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ formatDecimal(aiMealPlan.breakfast.calories) }}kcal · {{ aiMealPlan.breakfast.comment }}
            </div>
          </div>

          <!-- 점심 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">점심</div>
            </div>
            <div class="text-white">{{ aiMealPlan.lunch.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ formatDecimal(aiMealPlan.lunch.calories) }}kcal · {{ aiMealPlan.lunch.comment }}
            </div>
          </div>

          <!-- 저녁 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">저녁</div>
            </div>
            <div class="text-white">{{ aiMealPlan.dinner.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ formatDecimal(aiMealPlan.dinner.calories) }}kcal · {{ aiMealPlan.dinner.comment }}
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-zinc-500">식단 정보를 불러오지 못했습니다.</div>
      </div>

      <!-- 우측: 참여 중인 챌린지 (캐러셀) -->
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full relative overflow-hidden group"
      >
        <!-- 배경 이미지 (Blur) - Only show if currentChallenge exists -->
        <div
          v-if="currentChallenge"
          class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm pointer-events-none transition-all duration-500"
          :style="{ backgroundImage: `url(${currentChallenge.image})` }"
        ></div>

        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-4 h-8">
            <div class="flex items-center gap-2">
              <Trophy class="w-5 h-5 text-amber-400" />
              <h2 class="text-xl text-white leading-none">참여 중인 챌린지</h2>
            </div>

            <!-- Carousel Controls - Show only if challenges exist -->
            <div v-if="activeChallenges.length > 0" class="flex items-center gap-2">
              <button
                @click="prevChallenge"
                class="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft class="w-6 h-6" />
              </button>
              <span class="text-sm text-zinc-500">{{ currentChallengeIndex + 1 }} / {{ activeChallenges.length }}</span>
              <button
                @click="nextChallenge"
                class="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronRight class="w-6 h-6" />
              </button>
            </div>
          </div>

          <!-- Challenge Content -->
          <div v-if="currentChallenge" class="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <!-- Image Wrapper -->
            <div class="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-zinc-700">
              <img :src="currentChallenge.image" class="w-full h-full object-cover" alt="Challenge" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div class="absolute bottom-4 left-4 text-left">
                <div class="text-amber-400 text-sm font-bold mb-1">진행 중 🔥</div>
                <h3 class="text-2xl text-white font-bold">{{ currentChallenge.title }}</h3>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-4 w-full">
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">진행도</div>
                <div class="text-lg font-bold text-emerald-400">{{ formatDecimal(currentChallenge.progress) }}%</div>
              </div>
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">성공 일수</div>
                <div class="text-lg font-bold text-white">
                  {{ currentChallenge.currentDay }}/{{ currentChallenge.totalDays }}일
                </div>
              </div>
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">남은 기간</div>
                <div class="text-lg font-bold text-blue-400">D-{{ currentChallenge.dDay }}</div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex-1 flex items-center justify-center text-zinc-500">참여 중인 챌린지가 없습니다.</div>
        </div>
      </div>
    </div>

    <!-- 하단 영역 - 루틴 타임라인 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-2 h-8">
          <Clock class="w-5 h-5 text-zinc-400" />
          <h2 class="text-xl text-white leading-none">루틴 타임라인</h2>
        </div>

        <!-- 날짜 네비게이션 (중앙 정렬) -->
        <div
          class="flex items-center justify-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        >
          <button
            @click="changeDate(-1)"
            class="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div class="relative mx-3">
            <button
              @click="openDatePicker"
              class="text-white font-medium hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              {{ formattedDate }}
            </button>
            <input
              ref="dateInputRef"
              type="date"
              v-model="currentDate"
              class="absolute inset-0 opacity-0 pointer-events-none"
            />
          </div>

          <button
            @click="changeDate(1)"
            :disabled="isToday"
            :class="
              cn(
                'p-1 rounded transition-colors',
                isToday ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
              )
            "
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <div class="flex gap-3">
          <Button @click="navigateTo('/meal-register')" class="bg-emerald-500 hover:bg-emerald-600 text-white">
            식단 추가하기
          </Button>
          <Button @click="navigateTo('/exercise-register')" class="bg-blue-500 hover:bg-blue-600 text-white">
            운동 추가하기
          </Button>
        </div>
      </div>

      <!-- 타임라인 -->
      <div class="relative pl-24">
        <!-- 세로 라인 -->
        <div class="absolute left-[88px] top-0 bottom-0 w-0.5 bg-zinc-800"></div>

        <!-- 타임라인 아이템들 (Unified) -->
        <div class="space-y-6">
          <div v-for="item in timelineItems" :key="item.id" class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">{{ item.time }}</div>

            <!-- Dot (Color based on Type) -->
            <div
              class="absolute left-[-7px] w-3 h-3 rounded-full border-2 border-zinc-950"
              :class="item.colorClass === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'"
            ></div>

            <div 
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5 cursor-pointer hover:bg-zinc-700/50 transition-colors"
              @click="openDetail(item)"
            >
              <div class="flex items-start gap-4">
                <div
                  class="w-28 h-28 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  :class="
                    item.colorClass === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                      : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                  "
                >
                  <img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    alt="Meal photo"
                    class="w-full h-full object-contain bg-zinc-950"
                  />
                  <component
                    v-else
                    :is="item.icon"
                    class="w-10 h-10"
                    :class="item.colorClass === 'emerald' ? 'text-emerald-500' : 'text-blue-500'"
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">
                    {{ item.title }} <span v-if="item.time" class="text-zinc-500 font-normal">· {{ item.time }}</span>
                  </h3>
                  <p class="text-zinc-300">{{ item.desc }}</p>
                  <p class="text-sm text-zinc-400">{{ item.subDesc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="timelineItems.length === 0" class="relative flex gap-6 items-center">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">...</div>
            <div class="flex-1 p-5 text-center text-zinc-500 text-sm">오늘의 기록이 없습니다.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diet Detail Dialog -->
    <Dialog v-model:open="isDietDialogOpen">
      <div class="space-y-6" v-if="selectedTimelineItem">
        <div class="flex items-center gap-2">
           <Utensils class="w-5 h-5 text-emerald-500" />
           <h3 class="text-xl text-white font-bold">{{ selectedTimelineItem.title }} 상세</h3>
        </div>

        <!-- Image -->
        <div v-if="selectedTimelineItem.imageUrl" class="w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden">
             <img :src="selectedTimelineItem.imageUrl" class="w-full h-full object-contain" />
        </div>

        <div class="space-y-4">
             <div class="flex justify-between items-end border-b border-zinc-700 pb-2">
                <span class="text-sm text-zinc-400">{{ formattedDate }} {{ selectedTimelineItem.time }}</span>
                <span class="text-emerald-400 font-bold text-lg">{{ selectedTimelineItem.subDesc.split(' · ')[0] }}</span> 
             </div>

             <!-- Food List -->
             <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                <div v-for="(item, idx) in selectedTimelineItem.items" :key="idx" class="bg-zinc-800/50 rounded-lg p-3">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-white font-medium">{{ item.name }}</span>
                        <span class="text-zinc-300 text-sm">{{ item.calories }} kcal</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-zinc-500">
                        <span>{{ (item.amount || 0) / 100 }}인분</span>
                        <span v-if="item.carbs !== undefined">
                            탄수화물 {{ formatDecimal(item.carbs) }}g · 단백질 {{ formatDecimal(item.protein) }}g · 지방 {{ formatDecimal(item.fat) }}g
                        </span>
                    </div>
                </div>
             </div>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t border-zinc-800">
             <Button variant="ghost" class="text-zinc-400 hover:text-white hover:bg-zinc-800" @click="handleEditDetail">
                수정
             </Button>
             <Button variant="ghost" class="text-red-500 hover:text-red-400 hover:bg-red-500/10" @click="handleDeleteDetail">
                삭제
             </Button>
        </div>
      </div>
    </Dialog>

    <!-- Exercise Detail Dialog -->
    <Dialog v-model:open="isExerciseDialogOpen">
      <div class="space-y-6" v-if="selectedTimelineItem">
        <div class="flex items-center gap-2">
           <Dumbbell class="w-5 h-5 text-blue-500" />
           <h3 class="text-xl text-white font-bold">{{ selectedTimelineItem.title }} 상세</h3>
        </div>

        <div class="space-y-4">
             <div class="flex justify-between items-end border-b border-zinc-700 pb-2">
                <span class="text-sm text-zinc-400">{{ formattedDate }} {{ selectedTimelineItem.time }}</span>
                <span class="text-blue-400 font-bold text-lg">{{ selectedTimelineItem.subDesc }}</span>
             </div>

             <!-- Exercise List -->
             <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                <div v-for="(item, idx) in selectedTimelineItem.items" :key="idx" class="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                        <div class="text-white font-medium">{{ item.name }}</div>
                        <div class="text-xs text-zinc-500">{{ item.duration }}분</div>
                    </div>
                    <div class="text-zinc-300 text-sm font-bold">
                        {{ item.calories }} kcal
                    </div>
                </div>
             </div>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t border-zinc-800">
             <Button variant="ghost" class="text-zinc-400 hover:text-white hover:bg-zinc-800" @click="handleEditDetail">
                수정
             </Button>
             <Button variant="ghost" class="text-red-500 hover:text-red-400 hover:bg-red-500/10" @click="handleDeleteDetail">
                삭제
             </Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
