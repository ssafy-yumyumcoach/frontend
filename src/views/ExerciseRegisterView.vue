<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, X, Calendar as CalendarIcon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Interfaces
interface Exercise {
  id: string
  name: string
  category: string
  met: number
  icon: string
}

interface SelectedExercise {
  id: string
  exerciseId: string
  name: string
  category: string
  duration: number // 분
  intensity: string // 낮음, 보통, 높음
  calories: number
}

// State
const router = useRouter()
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedTime = ref('18:00')
const searchQuery = ref('')
const selectedCategory = ref('전체')

const selectedExercises = ref<SelectedExercise[]>([
  {
    id: '1',
    exerciseId: 'squat',
    name: '스쿼트',
    category: '하체 · 근력',
    duration: 30,
    intensity: '보통',
    calories: 180
  },
  {
    id: '2',
    exerciseId: 'plank',
    name: '플랭크',
    category: '코어',
    duration: 15,
    intensity: '보통',
    calories: 140
  }
])

const exercises: Exercise[] = [
  { id: 'squat', name: '스쿼트', category: '근력', met: 5.0, icon: '🏋️' },
  { id: 'pushup', name: '푸시업', category: '근력', met: 3.8, icon: '💪' },
  { id: 'plank', name: '플랭크', category: '코어', met: 4.0, icon: '🧘' },
  { id: 'running', name: '러닝', category: '유산소', met: 7.0, icon: '🏃' },
  { id: 'walking', name: '걷기', category: '유산소', met: 3.5, icon: '🚶' },
  { id: 'yoga', name: '요가', category: '스트레칭', met: 2.5, icon: '🧘‍♀️' },
  { id: 'cycling', name: '사이클링', category: '유산소', met: 6.0, icon: '🚴' },
  { id: 'deadlift', name: '데드리프트', category: '근력', met: 6.0, icon: '🏋️‍♂️' },
]

const categories = ['전체', '유산소', '근력', '코어', '스트레칭']

// Computed
const formatDateDisplay = computed(() => {
  return selectedDate.value ? format(new Date(selectedDate.value), 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'
})

const filteredExercises = computed(() => {
  return exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '전체' || exercise.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const totalDuration = computed(() => {
  return selectedExercises.value.reduce((sum, ex) => sum + ex.duration, 0)
})

const totalCalories = computed(() => {
  return selectedExercises.value.reduce((sum, ex) => sum + ex.calories, 0)
})

// Methods
const handleAddExercise = (exercise: Exercise) => {
  const newExercise: SelectedExercise = {
    id: Date.now().toString(),
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    duration: 30,
    intensity: '보통',
    calories: 150 // Mock calculation
  }
  selectedExercises.value.push(newExercise)
}

const handleRemoveExercise = (id: string) => {
  selectedExercises.value = selectedExercises.value.filter(ex => ex.id !== id)
}

const handleUpdateExercise = (id: string, field: keyof SelectedExercise, value: any) => {
  const ex = selectedExercises.value.find(e => e.id === id)
  if (ex) {
    (ex as any)[field] = value
  }
}

const onNavigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top: Title & Meta Info -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <h2 class="text-2xl text-white">운동 기록하기</h2>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Picker -->
        <div class="relative">
          <input 
            type="date" 
            v-model="selectedDate" 
            style="opacity: 0;"
            class="absolute inset-0 w-full h-full cursor-pointer z-10"
          />
          <Button
            variant="outline"
            class="w-[200px] justify-start text-left bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ formatDateDisplay }}
          </Button>
        </div>

        <!-- Time Picker -->
        <Input
          type="time"
          v-model="selectedTime"
          class="w-[120px] bg-zinc-900 border-zinc-800 text-white dark-time-input"
        />
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Search & Filter -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <!-- Search Bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="운동 이름을 검색하세요 (예: 스쿼트, 걷기, 플랭크)"
              v-model="searchQuery"
              class="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <!-- Categories -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              class="px-4 py-2 rounded-lg transition-all"
              :class="selectedCategory === category ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'"
            >
              {{ category }}
            </button>
          </div>

          <!-- Exercise List -->
          <div class="space-y-3 max-h-[500px] overflow-y-auto">
            <div v-if="filteredExercises.length > 0">
              <div
                v-for="exercise in filteredExercises"
                :key="exercise.id"
                class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="text-2xl">{{ exercise.icon }}</span>
                    <div>
                      <div class="text-white">
                        {{ exercise.name }} <span class="text-zinc-400 text-sm">({{ exercise.category }})</span>
                      </div>
                      <div class="text-sm text-zinc-400">기본 MET: {{ exercise.met }}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    @click="handleAddExercise(exercise)"
                    class="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    추가하기
                  </Button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 space-y-2">
              <p class="text-zinc-400">해당 이름의 운동을 찾을 수 없어요.</p>
              <p class="text-zinc-500 text-sm">비슷한 이름으로 다시 검색해보세요.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Selected List & Form -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <h3 class="text-lg text-white pb-2 border-b border-zinc-800">오늘 기록할 운동</h3>
          
          <div v-if="selectedExercises.length === 0" class="text-center py-16 space-y-3">
            <div class="text-5xl">💪</div>
            <p class="text-zinc-400">오늘 등록할 운동이 아직 없어요.</p>
            <p class="text-zinc-500 text-sm">
              왼쪽에서 운동을 검색하거나<br />
              카테고리에서 골라 추가해보세요.
            </p>
          </div>
          
          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto">
            <div 
              v-for="exercise in selectedExercises" 
              :key="exercise.id"
              class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3"
            >
              <!-- Header -->
              <div class="flex items-center justify-between">
                <div class="text-white">
                  {{ exercise.name }} <span class="text-zinc-400 text-sm">({{ exercise.category }})</span>
                </div>
                <button
                  @click="handleRemoveExercise(exercise.id)"
                  class="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- Input Grid -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">시간(분)</label>
                  <Input
                    type="number"
                    :model-value="exercise.duration"
                    @update:model-value="(v) => handleUpdateExercise(exercise.id, 'duration', Number(v))"
                    class="h-9 bg-zinc-900 border-zinc-700 text-white"
                    min="0"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">강도</label>
                  <Select 
                    :model-value="exercise.intensity"
                    @update:model-value="(v) => handleUpdateExercise(exercise.id, 'intensity', v)"
                  >
                    <SelectTrigger class="h-9 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="낮음">낮음</SelectItem>
                      <SelectItem value="보통">보통</SelectItem>
                      <SelectItem value="높음">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <!-- Calorie Summary -->
              <div class="pt-2 border-t border-zinc-700">
                <div class="text-sm text-emerald-400">
                  예상 소모 칼로리: {{ exercise.calories }} kcal
                </div>
                <div class="text-xs text-zinc-500 mt-0.5">
                  ※ 소모 칼로리는 평균값으로 실제와 다를 수 있어요.
                </div>
              </div>
            </div>

            <!-- Add More Button -->
            <button class="w-full py-4 border-2 border-dashed border-zinc-700 rounded-lg text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2">
              <Plus class="w-5 h-5" />
              <span>운동 더 추가하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom: Summary & Save -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3 flex-1">
          <h3 class="text-xl text-white">오늘 운동 요약</h3>
          <div class="space-y-2">
            <p class="text-2xl text-emerald-400">
              총 운동 시간: {{ totalDuration }}분
            </p>
            <p class="text-zinc-300">
              총 소모 칼로리: {{ totalCalories }} kcal
            </p>
          </div>
        </div>

        <div class="flex gap-3">
           <Button 
            @click="onNavigate('/')"
            variant="outline" 
            class="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            취소
          </Button>
          <Button 
            @click="onNavigate('/')"
            class="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
          >
            이대로 운동 기록 저장하기
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.dark-time-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>
