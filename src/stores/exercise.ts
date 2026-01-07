import { defineStore } from "pinia";
import { ref, computed } from "vue";
import exerciseApi, {
  type Exercise,
  type ExerciseRecordCreateRequest,
} from "@/api/exercise";
import statsApi from "@/api/stats"; // For triggering AI review

export interface SelectedExercise {
  id: string; // Internal unique ID for the UI list
  recordId?: number; // Backend ID for existing records
  exerciseId: number; // API ID (Dynamic based on intensity)
  name: string;
  category: string;
  duration: number; // Minutes
  intensity: string; // "낮음", "중간", "높음" etc.
  calories: number;
  met: number;
}

export const useExerciseStore = defineStore("exercise", () => {
  // --- State ---
  const exercises = ref<Exercise[]>([]);
  const selectedExercises = ref<SelectedExercise[]>([]);
  const originalRecordIds = ref<number[]>([]); // To track deletions during edit
  const isLoading = ref(false);

  // --- Computed ---
  const groupedExercises = computed(() => {
    const groups: Record<string, Exercise[]> = {};
    exercises.value.forEach((ex) => {
      if (!groups[ex.name]) {
        groups[ex.name] = [];
      }
      groups[ex.name].push(ex);
    });
    return groups;
  });

  const totalDuration = computed(() => {
    return selectedExercises.value.reduce((sum, ex) => sum + ex.duration, 0);
  });

  const totalCalories = computed(() => {
    return selectedExercises.value.reduce((sum, ex) => sum + ex.calories, 0);
  });

  // --- Actions ---

  // 1. Fetch All Exercises
  const fetchExercises = async () => {
    if (exercises.value.length > 0) return; // Cache if already loaded
    isLoading.value = true;
    try {
      const response = await exerciseApi.getExercises();
      exercises.value = response.data;
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Load Data for Edit
  const loadEditData = async (ids: number[]) => {
    isLoading.value = true;
    selectedExercises.value = [];
    originalRecordIds.value = [];
    
    try {
      const promises = ids.map((id) => exerciseApi.getMyExerciseRecordDetail(id));
      const responses = await Promise.all(promises);

      // Store original IDs for delete tracking
      originalRecordIds.value = ids;

      selectedExercises.value = responses.map((res) => {
        const data = res.data;
        return {
          id: Date.now().toString() + Math.random(), // Unique UI ID
          recordId: data.recordId,
          exerciseId: data.exerciseId,
          name: data.exerciseName,
          category: data.type,
          duration: data.durationMinutes,
          intensity: data.intensityLevel,
          calories: data.calories,
          met: data.met,
        };
      });

      // Return the first record's date/time so the view can set the form date
      if (responses.length > 0 && responses[0].data.recordedAt) {
        return responses[0].data.recordedAt;
      }
      return null;
    } catch (e) {
      console.error("Failed to load edit data", e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // Utility: Calculate Calories
  const calculateCalories = (met: number, duration: number) => {
    // Formula: (MET * 3.5 * 70 * duration) / 200
    // Assuming 70kg weight for now as per original code
    return Math.floor((met * 3.5 * 70 * duration) / 200);   
  };

  // 3. Add Exercise to Selection
  const addExerciseToSelection = (exercise: Exercise) => {
    const variants = groupedExercises.value[exercise.name] || [exercise];
    // Default to "중간" or first available
    const defaultVariant = variants.find((v) => v.intensityLevel === "중간") || variants[0];

    const newExercise: SelectedExercise = {
      id: Date.now().toString() + Math.random(),
      exerciseId: defaultVariant.exerciseId,
      name: defaultVariant.name,
      category: defaultVariant.type,
      duration: 30, // Default duration
      intensity: defaultVariant.intensityLevel,
      calories: calculateCalories(defaultVariant.met, 30),
      met: defaultVariant.met,
    };
    selectedExercises.value.push(newExercise);
  };

  // 4. Remove Exercise from Selection
  const removeExerciseFromSelection = (id: string) => {
    selectedExercises.value = selectedExercises.value.filter((ex) => ex.id !== id);
  };

  // 5. Update Exercise in Selection
  const updateExerciseInSelection = (id: string, field: "duration" | "intensity", value: number | string) => {
    const target = selectedExercises.value.find((ex) => ex.id === id);
    if (!target) return;

    if (field === "duration") {
      target.duration = Number(value);
      target.calories = calculateCalories(target.met, target.duration);
    } else if (field === "intensity") {
      const newIntensity = String(value);
      const variants = groupedExercises.value[target.name];
      const newVariant = variants?.find((v) => v.intensityLevel === newIntensity);

      if (newVariant) {
        target.intensity = newIntensity;
        target.exerciseId = newVariant.exerciseId;
        target.met = newVariant.met;
        target.calories = calculateCalories(newVariant.met, target.duration);
      }
    }
  };

  // 6. Save Records (Create, Update, Delete)
  const saveExerciseRecords = async (dateStr: string, timeStr: string) => {
    if (selectedExercises.value.length === 0) {
      throw new Error("NO_SELECTION");
    }

    isLoading.value = true;
    try {
      const dateTime = `${dateStr}T${timeStr}:00`;

      // 1. Delete Removed Records first (to free up space/names if needed)
      const currentRecordIds = selectedExercises.value
        .map((ex) => ex.recordId)
        .filter((id): id is number => !!id);
      
      const idsToDelete = originalRecordIds.value.filter((id) => !currentRecordIds.includes(id));
      if (idsToDelete.length > 0) {
        await Promise.all(idsToDelete.map((id) => exerciseApi.deleteMyExerciseRecord(id)));
      }

      // 2. Update Existing Records
      const updateRecordsCheck = selectedExercises.value.filter((ex) => ex.recordId);
      if (updateRecordsCheck.length > 0) {
        await Promise.all(
          updateRecordsCheck.map((ex) =>
            exerciseApi.updateMyExerciseRecord(ex.recordId!, {
              exerciseId: ex.exerciseId,
              durationMinutes: ex.duration,
              recordedAt: dateTime,
            })
          )
        );
      }

      // 3. Create New Records
      // A. Create New Records (no recordId)
      const newRecordsCheck = selectedExercises.value.filter((ex) => !ex.recordId);
      if (newRecordsCheck.length > 0) {
        const newRecordsPayload: ExerciseRecordCreateRequest[] = newRecordsCheck.map((ex) => ({
          exerciseId: ex.exerciseId,
          durationMinutes: ex.duration,
          recordedAt: dateTime,
        }));
        await exerciseApi.createMyExerciseRecords(newRecordsPayload);
      }

      // Trigger AI Review (Fire & Forget)
      // Update local storage for staleness check
      localStorage.setItem('LAST_EXERCISE_UPDATE_TIME', new Date().toISOString());
      localStorage.setItem('LAST_EXERCISE_UPDATE_DATE', dateStr);
      statsApi.generateExerciseReview({ anchorDate: dateStr }).catch((e) => console.warn(e));

      // Clear selection after save
      selectedExercises.value = [];
      originalRecordIds.value = [];
      
      return true;
    } catch (e) {
      console.error("Failed to save exercise records:", e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const clearSelection = () => {
    selectedExercises.value = [];
    originalRecordIds.value = [];
  };

  return {
    exercises,
    selectedExercises,
    isLoading,
    groupedExercises,
    totalDuration,
    totalCalories,
    fetchExercises,
    loadEditData,
    addExerciseToSelection,
    removeExerciseFromSelection,
    updateExerciseInSelection,
    saveExerciseRecords,
    clearSelection
  };
});
