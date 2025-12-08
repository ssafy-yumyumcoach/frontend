<script setup lang="ts">
import { ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Data Interfaces
interface NutritionData {
  day: string
  탄수화물: number
  단백질: number
  지방: number
  칼로리: number
  권장탄수화물: number
  권장단백질: number
  권장지방: number
  권장칼로리: number
}

interface ExerciseData {
  day: string
  운동시간: number
  소모칼로리: number
  목표시간: number
  목표칼로리: number
}

// State
const selectedWeek = ref('2025. 11. 17 ~ 2025. 11. 23')
const selectedNutrient = ref('탄수화물')
const selectedExerciseStat = ref('운동시간')

// Mock Data
const weeklyNutritionData: NutritionData[] = [
  { day: "월", 탄수화물: 280, 단백질: 95, 지방: 55, 칼로리: 1850, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "화", 탄수화물: 240, 단백질: 110, 지방: 58, 칼로리: 1920, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "수", 탄수화물: 320, 단백질: 85, 지방: 62, 칼로리: 2100, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "목", 탄수화물: 260, 단백질: 105, 지방: 54, 칼로리: 1880, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "금", 탄수화물: 300, 단백질: 90, 지방: 65, 칼로리: 2050, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "토", 탄수화물: 220, 단백질: 115, 지방: 52, 칼로리: 1800, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
  { day: "일", 탄수화물: 270, 단백질: 100, 지방: 59, 칼로리: 1950, 권장탄수화물: 250, 권장단백질: 120, 권장지방: 60, 권장칼로리: 2000 },
]

const weeklyExerciseData: ExerciseData[] = [
  { day: "월", 운동시간: 30, 소모칼로리: 250, 목표시간: 35, 목표칼로리: 300 },
  { day: "화", 운동시간: 0, 소모칼로리: 0, 목표시간: 35, 목표칼로리: 300 },
  { day: "수", 운동시간: 45, 소모칼로리: 380, 목표시간: 35, 목표칼로리: 300 },
  { day: "목", 운동시간: 25, 소모칼로리: 200, 목표시간: 35, 목표칼로리: 300 },
  { day: "금", 운동시간: 0, 소모칼로리: 0, 목표시간: 35, 목표칼로리: 300 },
  { day: "토", 운동시간: 50, 소모칼로리: 420, 목표시간: 35, 목표칼로리: 300 },
  { day: "일", 운동시간: 40, 소모칼로리: 320, 목표시간: 35, 목표칼로리: 300 },
]

// Computed Charts
const nutritionChartSeries = computed(() => {
  const actualKey = selectedNutrient.value as keyof NutritionData
  const goalKey = `권장${selectedNutrient.value}` as keyof NutritionData
  
  return [
    {
      name: '실제 섭취',
      type: 'column',
      data: weeklyNutritionData.map(d => d[actualKey] as number)
    },
    {
      name: '권장량',
      type: 'line',
      data: weeklyNutritionData.map(d => d[goalKey] as number)
    }
  ]
})

const exerciseChartSeries = computed(() => {
  const actualKey = selectedExerciseStat.value as keyof ExerciseData
  const goalKey = selectedExerciseStat.value === '운동시간' ? '목표시간' : '목표칼로리' as keyof ExerciseData
  
  return [
    {
      name: selectedExerciseStat.value === '운동시간' ? '운동 시간' : '소모 칼로리',
      type: 'column',
      data: weeklyExerciseData.map(d => d[actualKey] as number)
    },
    {
      name: '일일 목표',
      type: 'line',
      data: weeklyExerciseData.map(d => d[goalKey] as number)
    }
  ]
})

// Common Chart Options
const getChartOptions = (yAxisTitle: string, barColor: string): ApexOptions => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent'
  },
  colors: [barColor, '#6b7280'],
  stroke: {
    width: [0, 2],
    curve: 'smooth',
    dashArray: [0, 5]
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%'
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: weeklyNutritionData.map(d => d.day),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#a1a1aa' } }
  },
  yaxis: {
    title: {
      text: yAxisTitle,
      style: { color: '#a1a1aa' }
    },
    labels: { style: { colors: '#a1a1aa' } }
  },
  grid: {
    borderColor: '#27272a',
    strokeDashArray: 4
  },
  tooltip: {
    theme: 'dark',
    x: { show: true }
  },
  legend: { show: false }
})

const nutritionOptions = computed(() => 
  getChartOptions(selectedNutrient.value === '칼로리' ? 'kcal' : 'g', '#10b981')
)

const exerciseOptions = computed(() => 
  getChartOptions(selectedExerciseStat.value === '소모칼로리' ? 'kcal' : '분', '#f97316')
)

</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h2 class="text-2xl text-white font-bold">주간 통계</h2>
      
      <Select v-model="selectedWeek">
        <SelectTrigger class="w-[280px] bg-zinc-900 border-zinc-800 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2025. 11. 17 ~ 2025. 11. 23">2025. 11. 17 ~ 2025. 11. 23</SelectItem>
          <SelectItem value="2025. 11. 10 ~ 2025. 11. 16">2025. 11. 10 ~ 2025. 11. 16</SelectItem>
          <SelectItem value="2025. 11. 03 ~ 2025. 11. 09">2025. 11. 03 ~ 2025. 11. 09</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 영양 균형 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-white font-medium">영양 균형</h3>
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
        </div>
        <p class="text-sm text-zinc-400">
          단백질과 섬유질 섭취가 약간 부족합니다.
        </p>
      </div>

      <!-- 운동량 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-white font-medium">운동량</h3>
          <div class="w-4 h-4 rounded-full bg-emerald-500"></div>
        </div>
        <p class="text-sm text-zinc-400">
          목표 150분 중 120분 완료
        </p>
      </div>
    </div>

    <!-- Charts Area -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Nutrition Chart -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white font-bold">주간 영양소 섭취 추이</h3>
          <Select v-model="selectedNutrient">
            <SelectTrigger class="w-[140px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="탄수화물">탄수화물</SelectItem>
              <SelectItem value="단백질">단백질</SelectItem>
              <SelectItem value="지방">지방</SelectItem>
              <SelectItem value="칼로리">칼로리</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="w-full h-[480px]">
          <VueApexCharts
            height="100%"
            width="100%"
            type="line"
            :options="nutritionOptions"
            :series="nutritionChartSeries"
          />
        </div>

        <div class="pt-6 border-t border-zinc-800">
          <p class="text-zinc-300 leading-relaxed">
            이번 주에는 수요일과 금요일에 {{ selectedNutrient }} 섭취가 권장량보다 높았어요.
          </p>
        </div>
      </div>

      <!-- Exercise Chart -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xl text-white font-bold">주간 운동 추이</h3>
          <Select v-model="selectedExerciseStat">
            <SelectTrigger class="w-[140px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="운동시간">운동시간</SelectItem>
              <SelectItem value="소모칼로리">소모칼로리</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="w-full h-[480px]">
          <VueApexCharts
            height="100%"
            width="100%"
            type="line"
            :options="exerciseOptions"
            :series="exerciseChartSeries"
          />
        </div>

        <div class="pt-6 border-t border-zinc-800">
          <p class="text-zinc-300 leading-relaxed">
             이번 주는 토요일과 수요일에 목표보다 많이 운동했어요. 이번 달 목표 대비 36% 달성 중입니다.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
