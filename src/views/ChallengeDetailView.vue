<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Award,
  Star
} from 'lucide-vue-next'

import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()
const challengeId = route.params.id as string

// Interfaces
interface ChallengeInfo {
  id: string
  type: 'meal' | 'exercise'
  title: string
  period: string
  shortDescription: string
  progress: number
  status: 'not-joined' | 'in-progress'
  selectedDifficulty?: '초급' | '중급' | '고급'
  progressDetail: string
  goalDescription: string
  difficultyConditions: {
    beginner: string
    intermediate: string
    advanced: string
  }
}

// Sample Data
const challengeData: Record<string, ChallengeInfo> = {
  '1': {
    id: '1',
    type: 'meal',
    title: '11월 식단 기록 챌린지',
    period: '2025. 11. 01 ~ 2025. 11. 30',
    shortDescription: '한 주에 3일 이상 식단을 기록하는 것을 목표로 해요.',
    progress: 45,
    status: 'in-progress',
    selectedDifficulty: '중급',
    progressDetail: '이번 달 목표 12일 중 5일 식단 기록 완료',
    goalDescription: '한 달 동안, 꾸준히 식단을 기록하는 습관을 만드는 것이 목표입니다.',
    difficultyConditions: {
      beginner: '주 2일 이상 식단 기록',
      intermediate: '주 3일 이상 식단 기록',
      advanced: '주 5일 이상 식단 기록',
    },
  },
  '2': {
    id: '2',
    type: 'exercise',
    title: '11월 운동 습관 챌린지',
    period: '2025. 11. 01 ~ 2025. 11. 30',
    shortDescription: '주 3일 이상, 총 150분 이상 운동하는 것을 목표로 해요.',
    progress: 0,
    status: 'not-joined',
    progressDetail: '',
    goalDescription: '한 달 동안, 꾸준히 운동하는 습관을 만드는 것이 목표입니다.',
    difficultyConditions: {
      beginner: '주 2일 이상, 총 90분 이상 운동',
      intermediate: '주 3일 이상, 총 150분 이상 운동',
      advanced: '주 5일 이상, 총 250분 이상 운동',
    },
  },
  '3': {
    id: '3',
    type: 'meal',
    title: '11월 단백질 챌린지',
    period: '2025. 11. 01 ~ 2025. 11. 30',
    shortDescription: '한 주에 4일 이상 단백질 목표량을 달성하는 것을 목표로 해요.',
    progress: 0,
    status: 'not-joined',
    progressDetail: '',
    goalDescription: '한 달 동안, 충분한 단백질 섭취를 통해 건강한 식습관을 만드는 것이 목표입니다.',
    difficultyConditions: {
      beginner: '주 2일 이상 단백질 목표량(60g) 달성',
      intermediate: '주 4일 이상 단백질 목표량(80g) 달성',
      advanced: '주 5일 이상 단백질 목표량(100g) 달성',
    },
  },
}

const challengeInfo = ref<ChallengeInfo>(challengeData[challengeId] || challengeData['1'])
const selectedDifficulty = ref<'초급' | '중급' | '고급'>('중급')

const difficulties = [
  {
    level: '초급' as const,
    requirement: challengeInfo.value.difficultyConditions.beginner,
    description: '처음 도전하는 분에게 추천',
  },
  {
    level: '중급' as const,
    requirement: challengeInfo.value.difficultyConditions.intermediate,
    description: '평소에 어느 정도 관리해온 분',
  },
  {
    level: '고급' as const,
    requirement: challengeInfo.value.difficultyConditions.advanced,
    description: '이번 달에 강하게 도전해보고 싶은 분',
  },
]

const goBack = () => {
    router.back()
}

const handleJoinToggle = () => {
    console.log('Toggle join logic')
    if (challengeInfo.value.status === 'not-joined') {
        challengeInfo.value.status = 'in-progress'
        challengeInfo.value.progress = 0
        challengeInfo.value.selectedDifficulty = selectedDifficulty.value
        challengeInfo.value.progressDetail = '방금 시작했어요!'
    }
}

</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with Back Button -->


    <!-- Main Content -->
    <main class="flex-1 p-6 overflow-y-auto bg-zinc-950">
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Back Button Area -->
        <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              @click="goBack"
              class="text-zinc-400 hover:text-white p-2 -ml-2"
            >
              <ArrowLeft class="w-5 h-5 mr-2" />
              목록으로 돌아가기
            </Button>
        </div>

        <!-- Info Card -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
          <!-- Tag -->
          <div>
            <span class="inline-block text-sm px-3 py-1 rounded-full"
                  :class="challengeInfo.type === 'meal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'">
              11월 공통 챌린지
            </span>
          </div>

          <h2 class="text-3xl text-white">{{ challengeInfo.title }}</h2>
          <p class="text-zinc-400">{{ challengeInfo.shortDescription }}</p>

          <div class="flex items-center gap-2 text-zinc-300 text-sm">
            <Calendar class="w-5 h-5" />
            <span>기간: {{ challengeInfo.period }}</span>
          </div>

          <!-- Difficulty Select -->
          <div class="space-y-4 pt-4 border-t border-zinc-800">
            <h3 class="text-white">난이도 선택</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                v-for="diff in difficulties"
                :key="diff.level"
                @click="selectedDifficulty = diff.level"
                :disabled="challengeInfo.status === 'in-progress'"
                class="p-4 rounded-lg border-2 transition-all text-left"
                :class="[
                    selectedDifficulty === diff.level 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600',
                    challengeInfo.status === 'in-progress' ? 'cursor-not-allowed opacity-60' : ''
                ]"
              >
                <div class="space-y-2">
                  <div class="text-lg" :class="selectedDifficulty === diff.level ? 'text-emerald-400' : 'text-white'">
                    {{ diff.level }}
                  </div>
                  <div class="text-sm text-zinc-300">{{ diff.requirement }}</div>
                  <div class="text-xs text-zinc-500">{{ diff.description }}</div>
                </div>
              </button>
            </div>
            <p v-if="challengeInfo.status === 'in-progress'" class="text-xs text-zinc-500">
                * 참여 중에는 난이도를 변경할 수 없습니다
            </p>
          </div>

          <!-- Join Button -->
          <div v-if="challengeInfo.status === 'not-joined'" class="pt-4">
            <Button
              @click="handleJoinToggle"
              class="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              참여하기
            </Button>
          </div>
        </div>

        <!-- Progress & Reward -->
        <div v-if="challengeInfo.status === 'in-progress'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Progress -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 class="text-xl text-white">내 진행률</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-3xl text-emerald-400">{{ challengeInfo.progress }}%</span>
                        <span class="text-sm text-zinc-500">선택한 난이도: {{ challengeInfo.selectedDifficulty }}</span>
                    </div>
                    <div class="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${challengeInfo.progress}%` }" />
                    </div>
                    <p class="text-sm text-zinc-400 pt-2">{{ challengeInfo.progressDetail }}</p>
                </div>
            </div>

            <!-- Reward -->
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 class="text-xl text-white">달성 보상</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <Award class="w-6 h-6 text-yellow-500" />
                        <div class="flex-1">
                            <p class="text-white text-sm">{{ challengeInfo.title }} 뱃지</p>
                            <p class="text-xs text-zinc-500">난이도에 따라 색상이 달라져요</p>
                        </div>
                    </div>
                    <div v-if="challengeInfo.selectedDifficulty === '고급'" class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <Star class="w-6 h-6 text-purple-500" />
                        <div class="flex-1">
                            <p class="text-white text-sm">칭호: "{{ challengeInfo.title.replace('11월 ', '') }} 마스터"</p>
                            <p class="text-xs text-zinc-500">고급 난이도 완료 보상</p>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-zinc-500 pt-2">난이도가 높을수록 더 높은 등급의 뱃지와 보상을 받을 수 있어요.</p>
            </div>
        </div>

        <!-- Challenge Details -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-8">
            <div class="space-y-3">
                <h3 class="text-xl text-white">챌린지 목표</h3>
                <p class="text-zinc-400 leading-relaxed">{{ challengeInfo.goalDescription }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-xl text-white">난이도별 조건</h3>
                <div class="space-y-3">
                    <div v-for="diff in difficulties" :key="diff.level" class="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
                        <div class="w-16 text-center">
                            <span class="text-emerald-400">{{ diff.level }}</span>
                        </div>
                        <div class="flex-1 text-zinc-300 text-sm">{{ diff.requirement }}</div>
                    </div>
                </div>
            </div>

            <div class="space-y-3">
                <h3 class="text-xl text-white">유의 사항</h3>
                <ul class="space-y-2">
                    <li class="flex items-start gap-3 text-zinc-400">
                        <CheckCircle2 class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>개인의 건강 상태에 따라 무리가 가지 않는 범위에서 참여해주세요.</span>
                    </li>
                    <li class="flex items-start gap-3 text-zinc-400">
                        <CheckCircle2 class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>식단/운동 기록을 남겨야만 진행률에 반영됩니다.</span>
                    </li>
                    <li class="flex items-start gap-3 text-zinc-400">
                        <CheckCircle2 class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>챌린지 기간 동안 꾸준히 기록하는 것이 중요합니다.</span>
                    </li>
                </ul>
            </div>
        </div>

      </div>
    </main>
  </div>
</template>
