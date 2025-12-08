<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, Trash2, X, Calendar as CalendarIcon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

import Button from '@/components/ui/Button.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Input from '@/components/ui/Input.vue'
import ImageWithFallback from '@/components/figma/ImageWithFallback.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Interfaces
interface FoodItem {
  id: string
  name: string
  checked: boolean
  serving: string // "1인분" etc.
  servingAmount: string // stored as string for Select functionality, converted safely
  calories: number
  carbs: number
  protein: number
  fat: number
  manualInput: boolean
}

// State
const router = useRouter()
const selectedDate = ref(new Date().toISOString().split('T')[0]) // YYYY-MM-DD for input date
const selectedTime = ref('12:30')
const selectedMealType = ref('lunch')
const hasPhoto = ref(false)
const uploadedPhotoUrl = ref('')
const foods = ref<FoodItem[]>([])

// Formatting helpers
const formatDateDisplay = computed(() => {
  return selectedDate.value ? format(new Date(selectedDate.value), 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'
})

// Logic: Total Nutrition
const totalNutrition = computed(() => {
  return foods.value
    .filter(food => food.checked)
    .reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      carbs: acc.carbs + food.carbs,
      protein: acc.protein + food.protein,
      fat: acc.fat + food.fat,
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 })
})

// Logic: Meal Label
const mealTypeLabel = computed(() => {
  const map: Record<string, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식'
  }
  return map[selectedMealType.value] || '점심'
})

// Handlers
const handleToggleFood = (id: string) => {
  const food = foods.value.find(f => f.id === id)
  if (food) food.checked = !food.checked
}

const handleDeleteFood = (id: string) => {
  foods.value = foods.value.filter(f => f.id !== id)
}

const handleToggleManualInput = (id: string) => {
  const food = foods.value.find(f => f.id === id)
  if (food) food.manualInput = !food.manualInput
}

const handleUpdateNutrition = (id: string, field: keyof FoodItem, value: any) => {
  const food = foods.value.find(f => f.id === id)
  if (food) {
    (food as any)[field] = value
  }
}

const handlePhotoUpload = () => {
  hasPhoto.value = true
  uploadedPhotoUrl.value = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  foods.value = [
    { id: '1', name: '밥', checked: true, serving: '1인분', servingAmount: '1', calories: 250, carbs: 45, protein: 4, fat: 1, manualInput: false },
    { id: '2', name: '치킨 샐러드', checked: true, serving: '1인분', servingAmount: '1', calories: 320, carbs: 25, protein: 20, fat: 15, manualInput: false },
    { id: '3', name: '고구마', checked: true, serving: '1개', servingAmount: '1', calories: 110, carbs: 10, protein: 6, fat: 4, manualInput: false },
  ]
}

const handlePhotoDelete = () => {
  hasPhoto.value = false
  uploadedPhotoUrl.value = ''
  foods.value = []
}

const handleAddManualFood = () => {
  const newId = (foods.value.length + 1).toString()
  foods.value.push({
    id: newId,
    name: '새 음식',
    checked: true,
    serving: '1인분',
    servingAmount: '1',
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    manualInput: true
  })
}

const onNavigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top: Title & Meta Info -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <h2 class="text-2xl text-white">식단 등록</h2>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Picker (Native) -->
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
          class="w-[120px] bg-zinc-900 border-zinc-800 text-white"
        />

        <!-- Meal Type Toggle -->
        <div class="inline-flex rounded-md shadow-sm" role="group">
          <button
            v-for="type in ['breakfast', 'lunch', 'dinner', 'snack'] as const"
            :key="type"
            @click="selectedMealType = type"
            class="px-4 py-2 text-sm font-medium border border-zinc-800 transition-colors first:rounded-l-lg last:rounded-r-lg"
            :class="selectedMealType === type ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'"
          >
            {{ {breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식'}[type] }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Photo Upload -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div v-if="!hasPhoto" class="flex flex-col items-center justify-center py-16 space-y-4 border-2 border-dashed border-zinc-700 rounded-lg aspect-square">
            <div class="text-6xl">🍽</div>
            <p class="text-zinc-400 text-center">
              식단 사진을 업로드하면,<br />
              AI가 음식과 영양 정보를 분석해줘요.
            </p>
            <Button 
              @click="handlePhotoUpload"
              class="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Upload class="w-4 h-4 mr-2" />
              사진 업로드
            </Button>
          </div>
          <div v-else>
            <!-- Photo Preview -->
            <div class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <ImageWithFallback
                :src="uploadedPhotoUrl"
                alt="업로드된 식단 사진"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-4 right-4 flex gap-2">
                <Button 
                  size="sm"
                  class="bg-black/60 hover:bg-black/80 text-white border-0"
                  @click="handlePhotoUpload"
                >
                  <Upload class="w-4 h-4 mr-2" />
                  사진 변경
                </Button>
                <Button 
                  size="sm"
                  class="bg-black/60 hover:bg-black/80 text-white border-0"
                  @click="handlePhotoDelete"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <!-- AI Status -->
            <div class="flex items-center gap-2 text-emerald-400 mt-4">
              <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span class="text-sm">{{ foods.length }}개의 음식을 인식했어요.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Food List -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <!-- List Header -->
          <div class="space-y-3 pb-4 border-b border-zinc-800">
            <div class="flex items-center justify-between">
              <h3 class="text-lg text-white">이번 식단에 들어간 음식</h3>
              <span class="text-xs text-zinc-500">
                체크된 음식만 기록에 저장돼요.
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              AI가 사진에서 인식한 음식에, 직접 추가/수정한 음식도 함께 기록할 수 있어요.
            </p>
          </div>

          <!-- List Items -->
          <div class="space-y-3">
            <div 
              v-for="food in foods" 
              :key="food.id"
              class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2"
            >
              <!-- Item Header -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 flex-1">
                  <Checkbox 
                    :id="`food-${food.id}`"
                    :checked="food.checked"
                    @update:checked="() => handleToggleFood(food.id)"
                  />
                  <label 
                    :for="`food-${food.id}`"
                    class="text-white cursor-pointer flex-1"
                  >
                    {{ food.name }}
                  </label>
                  <span v-if="food.manualInput" class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                    수동 입력 모드
                  </span>
                </div>
                
                <div class="flex items-center gap-2">
                  <!-- Select Serving -->
                  <Select 
                    v-model="food.servingAmount"
                    :disabled="food.manualInput"
                  >
                    <SelectTrigger class="w-[110px] h-8 text-sm" :class="food.manualInput ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-zinc-900 border-zinc-700 text-white'">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5 인분</SelectItem>
                      <SelectItem value="1">1.0 인분</SelectItem>
                      <SelectItem value="1.5">1.5 인분</SelectItem>
                      <SelectItem value="2">2.0 인분</SelectItem>
                    </SelectContent>
                  </Select>

                  <button 
                    @click="handleDeleteFood(food.id)"
                    class="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Nutrition Info -->
              <div v-if="!food.manualInput" class="text-sm text-zinc-400">
                {{ food.calories }} kcal · 탄 {{ food.carbs }}g · 단백질 {{ food.protein }}g · 지방 {{ food.fat }}g
              </div>

              <!-- Manual Input Fields -->
              <div v-if="food.manualInput" class="grid grid-cols-2 gap-2 pt-1">
                 <div class="space-y-1">
                  <label class="text-xs text-zinc-500">열량 (kcal)</label>
                  <Input type="number" :model-value="food.calories" @update:model-value="(v) => handleUpdateNutrition(food.id, 'calories', Number(v))" class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">탄수화물 (g)</label>
                  <Input type="number" :model-value="food.carbs" @update:model-value="(v) => handleUpdateNutrition(food.id, 'carbs', Number(v))" class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">단백질 (g)</label>
                  <Input type="number" :model-value="food.protein" @update:model-value="(v) => handleUpdateNutrition(food.id, 'protein', Number(v))" class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">지방 (g)</label>
                  <Input type="number" :model-value="food.fat" @update:model-value="(v) => handleUpdateNutrition(food.id, 'fat', Number(v))" class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm" />
                </div>
              </div>

              <!-- Manual Input Toggle -->
              <div class="flex justify-end pt-1">
                <button 
                  @click="handleToggleManualInput(food.id)"
                  class="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  {{ food.manualInput ? '자동 입력으로 돌아가기' : '영양 정보 직접 입력하기' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Add Manual Food Button -->
          <button 
            @click="handleAddManualFood"
            class="w-full py-4 border-2 border-dashed border-zinc-700 rounded-lg text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
          >
            <span class="text-xl">+</span>
            <span>음식 직접 추가하기</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom: Summary & Save -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3 flex-1">
          <h3 class="text-xl text-white">오늘 {{ mealTypeLabel }} 식단 요약</h3>
          <div class="space-y-2">
            <p class="text-2xl text-emerald-400">
              총 섭취 예상 칼로리: {{ totalNutrition.calories }} kcal
            </p>
            <p class="text-zinc-300">
              탄수화물: {{ totalNutrition.carbs }}g / 단백질: {{ totalNutrition.protein }}g / 지방: {{ totalNutrition.fat }}g
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
            이 식단으로 기록하기
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
