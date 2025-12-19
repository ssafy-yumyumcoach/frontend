<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "vue-chartjs";
import Select from "@/components/ui/Select.vue";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// State
const selectedWeek = ref("2025. 11. 17 ~ 2025. 11. 23");
const selectedNutrient = ref("탄수화물");
const selectedExerciseStat = ref("운동시간");

const weekOptions = [
  { label: "2025. 11. 17 ~ 2025. 11. 23", value: "2025. 11. 17 ~ 2025. 11. 23" },
  { label: "2025. 11. 10 ~ 2025. 11. 16", value: "2025. 11. 10 ~ 2025. 11. 16" },
  { label: "2025. 11. 03 ~ 2025. 11. 09", value: "2025. 11. 03 ~ 2025. 11. 09" },
];

const nutrientOptions = [
  { label: "탄수화물", value: "탄수화물" },
  { label: "단백질", value: "단백질" },
  { label: "지방", value: "지방" },
  { label: "칼로리", value: "칼로리" },
];

const exerciseStatOptions = [
  { label: "운동시간", value: "운동시간" },
  { label: "소모칼로리", value: "소모칼로리" },
];

// Data
const weeklyNutritionData = [
  {
    day: "월",
    탄수화물: 280,
    단백질: 95,
    지방: 55,
    칼로리: 1850,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "화",
    탄수화물: 240,
    단백질: 110,
    지방: 58,
    칼로리: 1920,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "수",
    탄수화물: 320,
    단백질: 85,
    지방: 62,
    칼로리: 2100,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "목",
    탄수화물: 260,
    단백질: 105,
    지방: 54,
    칼로리: 1880,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "금",
    탄수화물: 300,
    단백질: 90,
    지방: 65,
    칼로리: 2050,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "토",
    탄수화물: 220,
    단백질: 115,
    지방: 52,
    칼로리: 1800,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
  {
    day: "일",
    탄수화물: 270,
    단백질: 100,
    지방: 59,
    칼로리: 1950,
    권장탄수화물: 250,
    권장단백질: 120,
    권장지방: 60,
    권장칼로리: 2000,
  },
];

const weeklyExerciseData = [
  { day: "월", 운동시간: 30, 소모칼로리: 250, 목표시간: 35, 목표칼로리: 300 },
  { day: "화", 운동시간: 0, 소모칼로리: 0, 목표시간: 35, 목표칼로리: 300 },
  { day: "수", 운동시간: 45, 소모칼로리: 380, 목표시간: 35, 목표칼로리: 300 },
  { day: "목", 운동시간: 25, 소모칼로리: 200, 목표시간: 35, 목표칼로리: 300 },
  { day: "금", 운동시간: 0, 소모칼로리: 0, 목표시간: 35, 목표칼로리: 300 },
  { day: "토", 운동시간: 50, 소모칼로리: 420, 목표시간: 35, 목표칼로리: 300 },
  { day: "일", 운동시간: 40, 소모칼로리: 320, 목표시간: 35, 목표칼로리: 300 },
];

// Chart Config
const commonOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#a1a1aa",
        usePointStyle: false,
        boxHeight: 8,
      },
    },
    tooltip: {
      backgroundColor: "#18181b",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#27272a",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { color: "#27272a" },
      ticks: { color: "#a1a1aa" },
    },
    y: {
      grid: { color: "#27272a" },
      ticks: { color: "#a1a1aa" },
    },
  },
};

// Nutrition Chart Data
const nutritionChartData = computed<ChartData<"bar" | "line">>(() => {
  const nutrient = selectedNutrient.value as keyof (typeof weeklyNutritionData)[0];
  const recommendedKey = `권장${nutrient}` as keyof (typeof weeklyNutritionData)[0];

  return {
    labels: weeklyNutritionData.map((d) => d.day),
    datasets: [
      {
        type: "line" as const,
        label: "권장량",
        borderColor: "#6b7280",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        data: weeklyNutritionData.map((d) => Number(d[recommendedKey])),
        order: 1,
      },
      {
        type: "bar" as const,
        label: "실제 섭취",
        backgroundColor: "#10b981",
        data: weeklyNutritionData.map((d) => Number(d[nutrient])),
        borderRadius: 4,
        order: 2,
      },
    ],
  } as any;
});

// Exercise Chart Data
const exerciseChartData = computed<ChartData<"bar" | "line">>(() => {
  const stat = selectedExerciseStat.value as keyof (typeof weeklyExerciseData)[0];
  const goalKey = stat === "운동시간" ? "목표시간" : "목표칼로리";

  return {
    labels: weeklyExerciseData.map((d) => d.day),
    datasets: [
      {
        type: "line" as const,
        label: "일일 목표",
        borderColor: "#6b7280",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        data: weeklyExerciseData.map((d) => Number(d[goalKey])),
        order: 1,
      },
      {
        type: "bar" as const,
        label: stat === "운동시간" ? "운동 시간" : "소모 칼로리",
        backgroundColor: "#f97316",
        data: weeklyExerciseData.map((d) => Number(d[stat])),
        borderRadius: 4,
        order: 2,
      },
    ],
  } as any;
});
</script>

<template>
  <div class="space-y-8">
    <!-- 상단 - 제목 + 주간 선택 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h2 class="text-2xl text-white">주간 통계</h2>

      <Select v-model="selectedWeek" :options="weekOptions" class="w-[280px] bg-zinc-900 border-zinc-800 text-white" />
    </div>

    <!-- 상단 요약 카드 2개 (신호등) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 영양 균형 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-white">영양 균형</h3>
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
        </div>
        <p class="text-sm text-zinc-400">단백질과 섬유질 섭취가 약간 부족합니다.</p>
      </div>

      <!-- 운동량 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-white">운동량</h3>
          <div class="w-4 h-4 rounded-full bg-emerald-500"></div>
        </div>
        <p class="text-sm text-zinc-400">목표 150분 중 120분 완료</p>
      </div>
    </div>

    <!-- 중단 - 2개 그래프 영역 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 왼쪽 - 주간 영양소 섭취 추이 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white">주간 영양소 섭취 추이</h3>
          <Select
            v-model="selectedNutrient"
            :options="nutrientOptions"
            class="w-[140px] h-9 text-sm bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- 그래프 -->
        <div class="w-full h-[400px]">
          <Bar :data="nutritionChartData" :options="commonOptions" />
        </div>

        <!-- 요약 텍스트 -->
        <div class="pt-6 border-t border-zinc-800">
          <p class="text-zinc-300 leading-relaxed">
            이번 주에는 수요일과 금요일에 {{ selectedNutrient }} 섭취가 권장량보다 높았어요.
          </p>
        </div>
      </div>

      <!-- 오른쪽 - 운동 통계 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white">주간 운동 추이</h3>
          <Select
            v-model="selectedExerciseStat"
            :options="exerciseStatOptions"
            class="w-[140px] h-9 text-sm bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- 그래프 -->
        <div class="w-full h-[400px]">
          <Bar :data="exerciseChartData" :options="commonOptions" />
        </div>

        <!-- 요약 텍스트 -->
        <div class="pt-6 border-t border-zinc-800">
          <p class="text-zinc-300 leading-relaxed">
            이번 주는 토요일과 수요일에 목표보다 많이 운동했어요. 이번 달 목표 대비 36% 달성 중입니다.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
