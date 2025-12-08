<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Utensils } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Checkbox from '@/components/ui/Checkbox.vue'

// State
const router = useRouter()
const height = ref('')
const weight = ref('')
const diseases = ref<string[]>([])
const otherDisease = ref('')
const goals = ref<string[]>([])
const otherGoal = ref('')
const activityLevel = ref('')

// Constants
const diseaseOptions = [
  { id: 'diabetes', label: '당뇨' },
  { id: 'hypertension', label: '고혈압' },
  { id: 'hyperlipidemia', label: '고지혈증' },
  { id: 'other', label: '기타' },
]

const goalOptions = [
  { id: 'weight-loss', label: '체중 감량' },
  { id: 'maintain', label: '체중 유지' },
  { id: 'muscle-gain', label: '근육 증가' },
  { id: 'disease-management', label: '질환 관리' },
  { id: 'other', label: '기타' },
]

const activityOptions = [
  {
    id: 'low',
    label: '낮음',
    description: '하루 대부분 앉아서 생활해요',
  },
  {
    id: 'medium',
    label: '보통',
    description: '가벼운 활동이나 주 1~2회 운동을 해요',
  },
  {
    id: 'high',
    label: '높음',
    description: '하루 활동량이 많거나 주 3회 이상 운동해요',
  },
]

// Handlers
const handleDiseaseChange = (diseaseId: string, checked: boolean) => {
  if (checked) {
    diseases.value.push(diseaseId)
  } else {
    diseases.value = diseases.value.filter(d => d !== diseaseId)
    if (diseaseId === 'other') {
      otherDisease.value = ''
    }
  }
}

const handleGoalChange = (goalId: string, checked: boolean) => {
  if (checked) {
    goals.value.push(goalId)
  } else {
    goals.value = goals.value.filter(g => g !== goalId)
    if (goalId === 'other') {
      otherGoal.value = ''
    }
  }
}

const handleSubmit = () => {
  console.log({
    height: height.value,
    weight: weight.value,
    diseases: diseases.value,
    otherDisease: otherDisease.value,
    goals: goals.value,
    otherGoal: otherGoal.value,
    activityLevel: activityLevel.value,
  })
  // After saving, navigate to Dashboard
  router.push('/dashboard')
}

const onSkip = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-8">
    <div class="w-full max-w-2xl space-y-8">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 blur-xl opacity-30"></div>
          <div class="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Utensils class="w-6 h-6 text-white" />
          </div>
        </div>
        <span class="text-3xl text-white">냠냠코치</span>
      </div>

      <!-- Header -->
      <div class="text-center space-y-3">
        <h1 class="text-white text-4xl">신체 정보를 입력해주세요</h1>
        <p class="text-zinc-400">
          더 정확한 건강 코칭을 위해 몇 가지 정보를 알려주세요. <span class="text-emerald-400">(선택사항)</span>
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-6">
        <!-- Height & Weight -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label class="text-zinc-300">키</Label>
            <div class="relative">
              <Input
                type="number"
                placeholder="예: 170"
                v-model="height"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pr-12"
              />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                cm
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-zinc-300">몸무게</Label>
            <div class="relative">
              <Input
                type="number"
                placeholder="예: 65"
                v-model="weight"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 pr-12"
              />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                kg
              </div>
            </div>
          </div>
        </div>

        <!-- Diseases -->
        <div class="space-y-3">
          <Label class="text-zinc-300">질병 여부 (해당되는 항목을 모두 선택)</Label>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="option in diseaseOptions" :key="option.id" class="space-y-2">
              <div class="flex items-center space-x-3">
                <Checkbox
                  :id="option.id"
                  :checked="diseases.includes(option.id)"
                  @update:checked="(checked) => handleDiseaseChange(option.id, checked)"
                  class="border-zinc-700"
                />
                <label
                  :for="option.id"
                  class="text-zinc-300 cursor-pointer"
                >
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>
          <Input
            v-if="diseases.includes('other')"
            type="text"
            placeholder="직접 입력"
            v-model="otherDisease"
            class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>

        <!-- Goals -->
        <div class="space-y-3">
          <Label class="text-zinc-300">목표 (해당되는 항목을 모두 선택)</Label>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="option in goalOptions" :key="option.id" class="space-y-2">
              <div class="flex items-center space-x-3">
                <Checkbox
                  :id="`goal-${option.id}`"
                  :checked="goals.includes(option.id)"
                  @update:checked="(checked) => handleGoalChange(option.id, checked)"
                  class="border-zinc-700"
                />
                <label
                  :for="`goal-${option.id}`"
                  class="text-zinc-300 cursor-pointer"
                >
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>
          <Input
            v-if="goals.includes('other')"
            type="text"
            placeholder="직접 입력"
            v-model="otherGoal"
            class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>

        <!-- Activity Level -->
        <div class="space-y-3">
          <Label class="text-zinc-300">활동 수준</Label>
          <div class="space-y-3">
            <button
              v-for="option in activityOptions"
              :key="option.id"
              @click="activityLevel = option.id"
              class="w-full px-4 py-4 rounded-lg border transition-all text-left"
              :class="activityLevel === option.id ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'"
            >
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div
                    :class="activityLevel === option.id ? 'text-white' : 'text-zinc-300'"
                  >
                    {{ option.label }}
                  </div>
                  <div
                    class="text-sm"
                    :class="activityLevel === option.id ? 'text-white/80' : 'text-zinc-500'"
                  >
                    {{ option.description }}
                  </div>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  :class="activityLevel === option.id ? 'border-white bg-white' : 'border-zinc-600'"
                >
                  <div v-if="activityLevel === option.id" class="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="space-y-4">
          <Button
            @click="handleSubmit"
            class="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20"
          >
            저장하고 시작하기
          </Button>
          <Button
            variant="ghost"
            @click="onSkip"
            class="w-full h-12 text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            건너뛰기
          </Button>
          <p class="text-zinc-600 text-sm text-center">
            나중에 마이페이지에서 언제든지 수정할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
