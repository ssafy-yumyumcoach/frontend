<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
} from 'lucide-vue-next'

import Button from '@/components/ui/Button.vue'
import ImageWithFallback from '@/components/figma/ImageWithFallback.vue'

const router = useRouter()

// Interfaces
interface Challenge {
  id: string
  title: string
  type: "meal" | "exercise"
  period: string
  description: string
  thumbnail: string
  status: "not-joined" | "in-progress"
  progress?: number
  difficulty?: "초급" | "중급" | "고급"
  progressDetail?: string
}

// Sample Data
const challenges = ref<Challenge[]>([
  {
    id: "1",
    title: "11월 식단 기록 챌린지",
    type: "meal",
    period: "2025. 11. 01 ~ 2025. 11. 30",
    description: "한 주에 3일 이상 식단을 기록하면 성공",
    thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    status: "in-progress",
    progress: 45,
    difficulty: "중급",
    progressDetail: "이번 주 2/3회 달성",
  },
  {
    id: "2",
    title: "11월 운동 습관 챌린지",
    type: "exercise",
    period: "2025. 11. 01 ~ 2025. 11. 30",
    description: "주 3일 이상, 총 150분 이상 운동하면 성공",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    status: "not-joined",
  },
  {
    id: "3",
    title: "11월 단백질 챌린지",
    type: "meal",
    period: "2025. 11. 01 ~ 2025. 11. 30",
    description: "한 주에 4일 이상 단백질 목표량 달성",
    thumbnail: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400",
    status: "not-joined",
  },
])

// Implementation using computed for now if we needed filtering, but sticking to React logic
// which displayed "all" challenges.

const handleJoinToggle = (challengeId: string) => {
  console.log("Toggle join/leave for challenge:", challengeId)
  // Mock Logic
  const challenge = challenges.value.find(c => c.id === challengeId)
  if (challenge) {
      if (challenge.status === 'in-progress') {
          challenge.status = 'not-joined'
          challenge.progress = 0
          challenge.progressDetail = ''
          challenge.difficulty = undefined
      } else {
          challenge.status = 'in-progress'
          challenge.progress = 0
          challenge.progressDetail = '이제 막 시작했어요!'
          challenge.difficulty = '초급'
      }
  }
}

const navigateToDetail = (challengeId: string) => {
    router.push(`/challenge/${challengeId}`)
}

</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Main Content -->
    <main class="flex-1 p-6 overflow-y-auto bg-zinc-950">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Description -->
        <p class="text-zinc-400">
          매달 1~3개의 챌린지가 제공되며, 모든 사용자가 같은 챌린지에 도전할 수 있어요.
        </p>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="challenge in challenges"
            :key="challenge.id"
            class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video w-full overflow-hidden bg-zinc-800">
              <ImageWithFallback
                :src="challenge.thumbnail"
                :alt="challenge.title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content -->
            <div class="p-5 space-y-4">
              <!-- Type Label -->
              <div>
                <span
                  class="inline-block text-xs px-3 py-1 rounded-full"
                  :class="challenge.type === 'meal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'"
                >
                  {{ challenge.type === "meal" ? "식단 챌린지" : "운동 챌린지" }}
                </span>
              </div>

              <!-- Title -->
              <h3 class="text-xl text-white">{{ challenge.title }}</h3>

              <!-- Description -->
              <p class="text-sm text-zinc-400">{{ challenge.description }}</p>

              <!-- Period -->
              <div class="flex items-center gap-2 text-zinc-500 text-sm">
                <Calendar class="w-4 h-4" />
                <span>기간: {{ challenge.period }}</span>
              </div>

              <!-- Progress Area -->
              <div v-if="challenge.status === 'in-progress'" class="space-y-2 pt-2 border-t border-zinc-800">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-400">진행률 {{ challenge.progress }}%</span>
                  <span class="text-zinc-400">{{ challenge.progressDetail }}</span>
                </div>
                <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 rounded-full"
                    :style="{ width: `${challenge.progress}%` }"
                  ></div>
                </div>
                <p v-if="challenge.difficulty" class="text-xs text-zinc-500 pt-1">
                  선택한 난이도: {{ challenge.difficulty }}
                </p>
              </div>
              <div v-else class="pt-2 border-t border-zinc-800">
                <p class="text-sm text-zinc-500">아직 참여하지 않았어요.</p>
              </div>

              <!-- Buttons -->
              <div class="flex gap-2 pt-2">
                <Button
                  @click="navigateToDetail(challenge.id)"
                  variant="outline"
                  class="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  챌린지 상세보기
                </Button>
                <Button
                  @click="handleJoinToggle(challenge.id)"
                  :variant="challenge.status === 'in-progress' ? 'outline' : 'default'"
                  class="flex-1"
                  :class="challenge.status === 'in-progress' ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'bg-emerald-500 hover:bg-emerald-600 text-white'"
                >
                  {{ challenge.status === "in-progress" ? "참여 중" : "참여하기" }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
