<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Lock } from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import Button from "@/components/ui/Button.vue";
import userApi from "@/api/user";

const route = useRoute();
const userId = Number(route.params.id);

// State
const isLoading = ref(true);

interface UserState {
  userId: number;
  username: string;
  profileImageUrl: string;
  introduction: string;
  followersCount: number;
  followingsCount: number;
  isFollowing: boolean;
}

const user = ref<UserState | null>(null);

// Badges for UI
interface UIBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  difficulty: string | null;
  acquired: boolean;
  acquiredDate: string;
}
const badges = ref<UIBadge[]>([]);
const currentTitleId = ref<number | null>(null);

// Methods
const fetchUserProfile = async () => {
  try {
    isLoading.value = true;
    const res = await userApi.getUserProfile(userId);
    const data = res.data;
    console.log("UserProfile Response:", data);

    let imgUrl = data.basic.profileImageUrl;
    // Fix double domain issue
    const cdnDomain = "https://d3sn2183nped6z.cloudfront.net/";
    if (imgUrl && imgUrl.includes(cdnDomain + cdnDomain)) {
      imgUrl = imgUrl.replace(cdnDomain + cdnDomain, cdnDomain);
    }

    user.value = {
      userId: data.basic.userId,
      username: data.basic.username,
      profileImageUrl: imgUrl,
      introduction: data.basic.introduction,
      followersCount: data.follow.followersCount,
      followingsCount: data.follow.followingsCount,
      isFollowing: data.follow.following,
    };

    // Map titles
    badges.value = (data.badges.titles || []).map((t) => ({
      id: t.titleId,
      name: t.name,
      description: t.description,
      icon: t.iconEmoji,
      difficulty: t.difficultyName,
      acquired: true,
      acquiredDate: t.obtainedAt ? t.obtainedAt.split("T")[0] : "",
    }));

    currentTitleId.value = data.badges.currentTitleId || null;
  } catch (e: any) {
    console.error("Failed to fetch user profile:", e);
    if (e.response?.status === 404) {
      alert("존재하지 않는 사용자입니다.");
    } else {
      alert("사용자 정보를 불러오는데 실패했습니다.");
    }
  } finally {
    isLoading.value = false;
  }
};

const handleFollowToggle = async () => {
  if (!user.value) return;

  // Snapshot for rollback
  const previousFollowing = user.value.isFollowing;
  const previousCount = user.value.followersCount;

  // Optimistic Update
  if (user.value.isFollowing) {
    user.value.isFollowing = false;
    user.value.followersCount = Math.max(0, user.value.followersCount - 1);
  } else {
    user.value.isFollowing = true;
    user.value.followersCount += 1;
  }

  try {
    if (previousFollowing) {
      // Request Unfollow
      await userApi.unfollowUser(user.value.userId);
    } else {
      // Request Follow
      await userApi.followUser(user.value.userId);
    }
  } catch (e: any) {
    console.error("Follow toggle failed:", e);

    // Rollback
    user.value.isFollowing = previousFollowing;
    user.value.followersCount = previousCount;

    const status = e.response?.status;
    const message = e.response?.data?.message;

    if (status === 401) {
      alert("로그인이 필요합니다.");
    } else if (status === 409) {
      alert(message || "이미 팔로우 중인 사용자입니다.");
      // If conflict, it means we are already following. ensure state reflects that.
      if (!previousFollowing) user.value.isFollowing = true;
    } else if (status === 400) {
      alert(message || "잘못된 팔로우 요청입니다.");
    } else {
      alert(message || "처리 중 오류가 발생했습니다.");
    }
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "초급":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "중급":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "고급":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<template>
  <div class="min-h-screen bg-black text-white p-8">
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="text-zinc-400">데이터를 불러오는 중...</div>
    </div>

    <div v-else-if="user" class="max-w-5xl mx-auto space-y-6">
      <!-- Section 1: User Profile Header -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <Avatar
              :src="user.profileImageUrl"
              :fallback="user.username?.charAt(0) || '?'"
              class="w-32 h-32 text-4xl"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 space-y-4 text-center md:text-left w-full">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 class="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                  {{ user.username || "Unknown" }}
                  <span
                    v-if="currentTitleId"
                    class="text-sm px-3 py-1 rounded border transition-colors"
                    :class="[
                      (() => {
                        const badge = badges.find((b) => b.id === Number(currentTitleId));
                        return badge?.difficulty
                          ? getDifficultyColor(badge.difficulty)
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700';
                      })(),
                    ]"
                  >
                    {{ badges.find((b) => b.id === Number(currentTitleId))?.name || "대표 뱃지" }}
                  </span>
                </h1>
                <p class="text-zinc-400 mt-1">{{ user.introduction || "소개가 없습니다." }}</p>
              </div>

              <!-- Follow Button -->
              <Button
                @click="handleFollowToggle"
                :class="
                  user.isFollowing
                    ? 'w-full md:w-auto px-6 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    : 'w-full md:w-auto px-6 bg-emerald-500 text-white hover:bg-emerald-600'
                "
              >
                {{ user.isFollowing ? "언팔로우" : "팔로우" }}
              </Button>
            </div>

            <!-- Stats -->
            <div class="flex items-center justify-center md:justify-start gap-6 pt-2">
              <div class="text-center">
                <div class="text-xl font-bold">{{ user.followersCount }}</div>
                <div class="text-xs text-zinc-500">팔로워</div>
              </div>
              <div class="w-px h-8 bg-zinc-800"></div>
              <div class="text-center">
                <div class="text-xl font-bold">{{ user.followingsCount }}</div>
                <div class="text-xs text-zinc-500">팔로잉</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Badge Collection -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl text-white">뱃지 컬렉션</h2>
          <span
            v-if="badges.filter((b) => b.acquired).length > 0"
            class="text-sm bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full"
          >
            {{ badges.filter((b) => b.acquired).length }}개 획득
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="badges.length === 0" class="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-2">
          <div class="text-4xl">📭</div>
          <p>아직 표시할 뱃지가 없습니다.</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="relative p-5 rounded-xl border-2 transition-all"
            :class="[
              badge.acquired ? 'bg-zinc-800/50' : 'bg-zinc-900/50 border-zinc-800 opacity-50',
              String(badge.id) === String(currentTitleId)
                ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-900/10'
                : 'border-zinc-700',
            ]"
          >
            <!-- Lock Icon for unacquired -->
            <div v-if="!badge.acquired" class="absolute top-3 right-3">
              <Lock class="w-4 h-4 text-zinc-600" />
            </div>

            <!-- Representative Badge Indicator -->
            <div v-if="String(badge.id) === String(currentTitleId)" class="absolute top-3 left-3">
              <span class="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded">대표</span>
            </div>

            <div class="space-y-3">
              <div class="text-4xl text-center">{{ badge.icon }}</div>

              <div class="space-y-1">
                <h3 class="text-center text-sm" :class="badge.acquired ? 'text-white' : 'text-zinc-500'">
                  {{ badge.name }}
                </h3>
                <p class="text-center text-xs" :class="badge.acquired ? 'text-zinc-400' : 'text-zinc-600'">
                  {{ badge.description }}
                </p>
              </div>

              <div class="flex justify-center" v-if="badge.difficulty">
                <span class="text-xs px-2 py-1 rounded-full border" :class="getDifficultyColor(badge.difficulty)">
                  {{ badge.difficulty }}
                </span>
              </div>

              <p v-if="badge.acquired && badge.acquiredDate" class="text-xs text-zinc-500 text-center pt-2">
                획득: {{ badge.acquiredDate }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
