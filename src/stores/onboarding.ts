import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useOnboardingStore = defineStore("onboarding", () => {
  // State
  const gender = ref<"male" | "female">("male");
  const age = ref<number>(25);
  const birthDate = ref<string>("");
  const height = ref<number | null>(null);
  const weight = ref<number | null>(null);
  const targetWeight = ref<number | null>(null);
  const activityLevel = ref<string>("MODERATE");
  const goals = ref<string[]>([]);
  const diseases = ref<string[]>([]);

  // Getters (Computed)
  const bmi = computed(() => {
    if (!height.value || !weight.value) return '0.0';
    const h = height.value / 100;
    return (weight.value / (h * h)).toFixed(1);
  });

  // Actions
  function setGender(val: "male" | "female") {
    gender.value = val;
  }

  function setAge(val: number) {
    age.value = val;
  }

  function setBirthDate(val: string) {
    birthDate.value = val;
  }

  function setHeight(val: number | null) {
    height.value = val;
  }

  function setWeight(val: number | null) {
    weight.value = val;
  }

  function setTargetWeight(val: number | null) {
    targetWeight.value = val;
  }

  function setActivityLevel(val: string) {
    activityLevel.value = val;
  }

  function toggleGoal(goal: string) {
    const index = goals.value.indexOf(goal);
    if (index === -1) {
      goals.value.push(goal);
    } else {
      goals.value.splice(index, 1);
    }
  }

  function toggleDisease(disease: string) {
    const index = diseases.value.indexOf(disease);
    if (index === -1) {
      diseases.value.push(disease);
    } else {
      diseases.value.splice(index, 1);
    }
  }

  function reset() {
    gender.value = "male";
    age.value = 25;
    birthDate.value = "";
    height.value = null;
    weight.value = null;
    targetWeight.value = null;
    activityLevel.value = "MODERATE";
    goals.value = [];
    diseases.value = [];
  }

  return {
    gender,
    age,
    birthDate,
    height,
    weight,
    targetWeight,
    activityLevel,
    goals,
    diseases,
    bmi,
    setGender,
    setAge,
    setBirthDate,
    setHeight,
    setWeight,
    setTargetWeight,
    setActivityLevel,
    toggleGoal,
    toggleDisease,
    reset,
  };
});
