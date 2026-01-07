<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Calendar } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import Button from "@/components/ui/Button.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";
import { useChallengeStore } from "@/stores/challenge";

const router = useRouter();
const challengeStore = useChallengeStore();
const { challenges, isLoading } = storeToRefs(challengeStore);

const activeTab = ref<"recruiting" | "joined">("recruiting"); // Renamed 'all' to 'recruiting'

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
  today.getDate()
).padStart(2, "0")}`;

const fetchChallenges = async () => {
  try {
    await challengeStore.fetchAllChallengesForListView();
  } catch (error) {
    alert("챌린지 목록을 불러오는데 실패했습니다.");
  }
};

onMounted(() => {
  fetchChallenges();
});

const filteredChallenges = computed(() => {
  if (activeTab.value === "joined") {
    // Exclude 'PRE_REGISTRATION' (Joined but not started yet)
    return challenges.value.filter((c) => c.isJoined && c.startDate <= todayStr);
  } else if (activeTab.value === "recruiting") {
    // Show challenges that are currently recruiting OR upcoming (not ended yet)
    return challenges.value.filter((c) => {
      return c.recruitEndDate >= todayStr;
    });
  }
  return challenges.value;
});

const handleJoinToggle = async (challengeId: number) => {
  // Always navigate to detail for consistency
  router.push(`/challenge-detail/${challengeId}`);
};

const navigateToDetail = (challengeId: number) => {
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
        v-for="tab in ['recruiting', 'joined']"
        :key="tab"
        @click="activeTab = tab as any"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :class="activeTab === tab ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'"
      >
        {{ tab === "recruiting" ? "모집 중" : "참여 중" }}
        <div v-if="activeTab === tab" class="absolute bottom-[-5px] left-0 w-full h-0.5 bg-emerald-500"></div>
      </button>
    </div>

    <!-- 챌린지 그리드 -->
    <div v-if="isLoading" class="text-center py-20 text-zinc-500">로딩 중...</div>

    <div v-else-if="filteredChallenges.length === 0" class="text-center py-20 text-zinc-500">
      {{ activeTab === "recruiting" ? "현재 모집 중인 챌린지가 없습니다." : "참여 중인 챌린지가 없습니다." }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="challenge in filteredChallenges"
        :key="challenge.challengeId"
        class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
      >
        <!-- 썸네일 -->
        <div class="relative aspect-video w-full overflow-hidden bg-zinc-800">
          <ImageWithFallback :src="challenge.imageUrl" :alt="challenge.title" class="w-full h-full object-cover" />
        </div>

        <!-- 내용 -->
        <div class="p-5 space-y-4">
          <!-- 제목 -->
          <h3 class="text-xl text-white font-semibold">
            {{ challenge.title }}
          </h3>

          <!-- 설명 -->
          <p class="text-sm text-zinc-400 line-clamp-2">
            {{ challenge.shortDescription }}
          </p>

          <!-- 기간 -->
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar class="w-4 h-4" />
              <span>진행: {{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
            </div>
            <div class="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar class="w-4 h-4 text-emerald-500" />
              <span class="text-emerald-500"
                >모집: {{ challenge.recruitStartDate }} ~ {{ challenge.recruitEndDate }}</span
              >
            </div>
          </div>

          <!-- 참여자 수 -->
          <div class="text-sm text-zinc-400">참여자 {{ challenge.participantsCount }}명</div>

          <!-- Progress Bar for Joined Challenges (Optional based on design, but data is available) -->
          <div
            v-if="challenge.isJoined && challenge.progressPercentage !== null"
            class="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1"
          >
            <div class="h-full bg-emerald-500" :style="{ width: `${challenge.progressPercentage}%` }"></div>
          </div>

          <!-- 버튼 -->
          <div class="flex gap-2 pt-2">
            <Button
              @click="navigateToDetail(challenge.challengeId)"
              variant="outline"
              class="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              상세보기
            </Button>
            <!-- Only show Join button if recruiting or not joined -->
            <Button
              v-if="!challenge.isJoined"
              @click="handleJoinToggle(challenge.challengeId)"
              class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              참여하기
            </Button>
            <Button
              v-else
              @click="handleJoinToggle(challenge.challengeId)"
              variant="outline"
              class="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              참여 중
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
