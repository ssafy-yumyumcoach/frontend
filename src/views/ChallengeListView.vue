<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Calendar } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";

interface Challenge {
  id: string;
  title: string;
  type: "meal" | "exercise";
  period: string;
  description: string;
  thumbnail: string;
  status: "not-joined" | "in-progress";
  progress?: number;
  difficulty?: "초급" | "중급" | "고급";
  progressDetail?: string;
}

const router = useRouter();
const activeTab = ref<"all" | "joined" | "recommended">("all");

// Mock Data
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
]);

const filteredChallenges = computed(() => {
  if (activeTab.value === "joined") {
    return challenges.value.filter((c) => c.status === "in-progress");
  } else if (activeTab.value === "recommended") {
    return challenges.value.filter((c) => c.status === "not-joined");
  }
  return challenges.value;
});

const handleJoinToggle = (challengeId: string) => {
  console.log("Toggle join/leave for challenge:", challengeId);
  // Implement join/leave logic here
};

const navigateToDetail = (challengeId: string) => {
  router.push(`/challenge-detail/${challengeId}`);
};
</script>

<template>
  <div class="space-y-6">
    <!-- 설명 -->
    <p class="text-zinc-400">매달 1~3개의 챌린지가 제공되며, 모든 사용자가 같은 챌린지에 도전할 수 있어요.</p>

    <!-- 탭 -->
    <div class="flex gap-2 border-b border-zinc-800 pb-1">
      <button
        v-for="tab in ['all', 'joined', 'recommended']"
        :key="tab"
        @click="activeTab = tab as any"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :class="activeTab === tab ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'"
      >
        {{ tab === "all" ? "전체" : tab === "joined" ? "참여 중" : "추천" }}
        <div v-if="activeTab === tab" class="absolute bottom-[-5px] left-0 w-full h-0.5 bg-emerald-500"></div>
      </button>
    </div>

    <!-- 챌린지 그리드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="challenge in filteredChallenges"
        :key="challenge.id"
        class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
      >
        <!-- 썸네일 -->
        <div class="relative aspect-video w-full overflow-hidden bg-zinc-800">
          <ImageWithFallback :src="challenge.thumbnail" :alt="challenge.title" class="w-full h-full object-cover" />
        </div>

        <!-- 내용 -->
        <div class="p-5 space-y-4">
          <!-- 타입 라벨 -->
          <div>
            <span
              class="inline-block text-xs px-3 py-1 rounded-full"
              :class="
                challenge.type === 'meal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
              "
            >
              {{ challenge.type === "meal" ? "식단 챌린지" : "운동 챌린지" }}
            </span>
          </div>

          <!-- 제목 -->
          <h3 class="text-xl text-white font-semibold">
            {{ challenge.title }}
          </h3>

          <!-- 설명 -->
          <p class="text-sm text-zinc-400 line-clamp-2">
            {{ challenge.description }}
          </p>

          <!-- 기간 -->
          <div class="flex items-center gap-2 text-zinc-500 text-sm">
            <Calendar class="w-4 h-4" />
            <span>기간: {{ challenge.period }}</span>
          </div>

          <!-- 진행률 영역 -->
          <div v-if="challenge.status === 'in-progress'" class="space-y-2 pt-2 border-t border-zinc-800">
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-400">진행률 {{ challenge.progress }}%</span>
              <span class="text-zinc-400">{{ challenge.progressDetail }}</span>
            </div>
            <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${challenge.progress}%` }"></div>
            </div>
            <p v-if="challenge.difficulty" class="text-xs text-zinc-500 pt-1">
              선택한 난이도: {{ challenge.difficulty }}
            </p>
          </div>
          <div v-else class="pt-2 border-t border-zinc-800">
            <p class="text-sm text-zinc-500">아직 참여하지 않았어요.</p>
          </div>

          <!-- 버튼 -->
          <div class="flex gap-2 pt-2">
            <Button
              @click="navigateToDetail(challenge.id)"
              variant="outline"
              class="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              상세보기
            </Button>
            <Button
              @click="handleJoinToggle(challenge.id)"
              :variant="challenge.status === 'in-progress' ? 'outline' : 'default'"
              class="flex-1"
              :class="
                challenge.status === 'in-progress'
                  ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              "
            >
              {{ challenge.status === "in-progress" ? "참여 중" : "참여하기" }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
