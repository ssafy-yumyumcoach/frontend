import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useOnboardingStore = defineStore("onboarding", () => {
  // State
  const gender = ref<"male" | "female">("male");
  const age = ref<number>(25);
  const height = ref<number>(170);
  const weight = ref<number>(65);
  const targetWeight = ref<number>(60);
  const activityLevel = ref<string>("moderate");
  const goals = ref<string[]>([]);
  const diseases = ref<string[]>([]);

  // Getters (Computed)
  const bmi = computed(() => {
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

  function setHeight(val: number) {
    height.value = val;
  }

  function setWeight(val: number) {
    weight.value = val;
  }

  function setTargetWeight(val: number) {
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
    height.value = 170;
    weight.value = 65;
    targetWeight.value = 60;
    activityLevel.value = "moderate";
    goals.value = [];
    diseases.value = [];
  }

  return {
    gender,
    age,
    height,
    weight,
    targetWeight,
    activityLevel,
    goals,
    diseases,
    bmi,
    setGender,
    setAge,
    setHeight,
    setWeight,
    setTargetWeight,
    setActivityLevel,
    toggleGoal,
    toggleDisease,
    reset,
  };
});
