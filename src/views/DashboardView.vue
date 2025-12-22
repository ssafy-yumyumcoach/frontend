<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Sparkles, Dumbbell, ChevronLeft, ChevronRight, Trophy, Activity, Clock } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import exerciseApi, { type ExerciseRecordListItem, type ExerciseRecordDetail } from "@/api/exercise/index";
import aiApi, { type MealPlanResponse } from "@/api/ai/index";

const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};

// --- Daily Stats (Mock for now, will implement later or keeping static as per plan) ---
const dailyStats = {
  intakeCalories: 1350,
  macros: {
    carbs: 180,
    protein: 120,
    fat: 45,
  },
  exerciseCalories: 320,
  exerciseTime: 45,
};

// --- Unified Timeline Integration ---
interface UnifiedTimelineItem {
  type: "MEAL" | "EXERCISE";
  id: number | string;
  recordIds?: number[];
  time: string; // HH:MM
  title: string;
  desc: string;
  subDesc: string;
  calories?: number;
  colorClass: string; // "emerald" | "blue" etc.
  icon: any; // Icon component
}

const timelineItems = ref<UnifiedTimelineItem[]>([]);

// --- Daily Exercise Records Integration ---
interface DisplayExerciseRecord extends ExerciseRecordListItem {
  calories?: number;
  detail?: ExerciseRecordDetail;
}

const todayExercises = ref<DisplayExerciseRecord[]>([]);

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchTodayExercises = async () => {
  try {
    const today = getTodayDate();
    const res = await exerciseApi.getMyExerciseRecords(today);

    // Enhance details
    const enhancedRecords = await Promise.all(
      res.data.map(async (record): Promise<DisplayExerciseRecord> => {
        if (record.recordId) {
          try {
            const detailRes = await exerciseApi.getMyExerciseRecordDetail(record.recordId);
            return { ...record, calories: detailRes.data.calories, detail: detailRes.data };
          } catch (e) {
            return record;
          }
        }
        return record;
      })
    );

    todayExercises.value = enhancedRecords;

    // Group by Time
    const groupedRecords: Record<string, DisplayExerciseRecord[]> = {};

    enhancedRecords.forEach((ex) => {
      let timeStr = "00:00";
      if (ex.detail?.recordedAt && ex.detail.recordedAt.includes("T")) {
        const parts = ex.detail.recordedAt.split("T");
        if (parts.length > 1) {
          timeStr = parts[1].substring(0, 5); // HH:MM
        }
      }

      if (!groupedRecords[timeStr]) {
        groupedRecords[timeStr] = [];
      }
      groupedRecords[timeStr].push(ex);
    });

    // Convert Groups to TimelineItems
    const exerciseTimelineItems: UnifiedTimelineItem[] = Object.keys(groupedRecords).map((timeStr) => {
      const group = groupedRecords[timeStr];
      const firstItem = group[0];

      // Calculate totals
      const totalGroupCalories = group.reduce((sum, r) => sum + (r.calories || 0), 0);

      // Create Description (e.g. "런닝 30분, 스쿼트 20분")
      const desc = group.map((r) => `${r.exerciseName} ${r.durationMinutes}분`).join(", ");

      const recordIds = group.map((r) => r.recordId).filter((id): id is number => !!id);

      return {
        type: "EXERCISE",
        id: firstItem.recordId || `group-${timeStr}`, // Note: Using first ID for now. For delete/edit group, we might need all IDs.
        recordIds: recordIds,
        time: timeStr,
        title: "운동",
        desc: desc,
        subDesc: `${totalGroupCalories} kcal 소모`, // User requested "320 kcal 소모" format
        colorClass: "blue",
        icon: Dumbbell,
      };
    });

    // Merge and Sort
    timelineItems.value = [...exerciseTimelineItems].sort((a, b) => {
      // Removed dummyMeals
      return a.time.localeCompare(b.time);
    });

    // Update stats
    const totalCalories = enhancedRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    const totalTime = enhancedRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

    dailyStats.exerciseCalories = Math.round(totalCalories);
    dailyStats.exerciseTime = Math.round(totalTime);
  } catch (e) {
    console.error("Failed to fetch exercise records", e);
    timelineItems.value = [];
  }
};

const aiMealPlan = ref<MealPlanResponse | null>(null);
const isAiLoading = ref(false);

const loadMealPlan = async () => {
  isAiLoading.value = true;
  const today = getTodayDate();

  try {
    // 1. Try to fetch existing plan
    const res = await aiApi.getMealPlan(today);

    if (res.data && res.data.generated) {
      aiMealPlan.value = res.data;
    } else {
      // 2. If generated=false (or empty), generate new plan
      console.log("Meal plan not generated yet. Generating new one...");
      const genRes = await aiApi.generateMealPlan({ targetDate: today });
      aiMealPlan.value = genRes.data;
    }
  } catch (e: any) {
    // Fallback: If 404 or other issues, try generating
    if (e.response && e.response.status === 404) {
      try {
        console.log("No existing meal plan found (404). Generating new one...");
        const genRes = await aiApi.generateMealPlan({ targetDate: today });
        aiMealPlan.value = genRes.data;
      } catch (genError) {
        console.error("Failed to generate meal plan", genError);
      }
    } else {
      console.error("Failed to fetch meal plan", e);
    }
  } finally {
    isAiLoading.value = false;
  }
};

onMounted(() => {
  fetchTodayExercises();
  loadMealPlan();
});

// Dummy Data for Challenges (Only Active)
const activeChallenges = ref([
  {
    id: 1,
    title: "2주 저녁 샐러드 챌린지",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    progress: 45,
    currentDay: 6,
    totalDays: 14,
    dDay: 8,
  },
  {
    id: 2,
    title: "매일 물 2L 마시기",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    progress: 80,
    currentDay: 24,
    totalDays: 30,
    dDay: 6,
  },
  {
    id: 3,
    title: "아침 공복 유산소",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    progress: 10,
    currentDay: 1,
    totalDays: 10,
    dDay: 9,
  },
]);

const currentChallengeIndex = ref(0);

const currentChallenge = computed(() => activeChallenges.value[currentChallengeIndex.value]);

const prevChallenge = () => {
  if (currentChallengeIndex.value > 0) {
    currentChallengeIndex.value--;
  } else {
    currentChallengeIndex.value = activeChallenges.value.length - 1;
  }
};

const nextChallenge = () => {
  if (currentChallengeIndex.value < activeChallenges.value.length - 1) {
    currentChallengeIndex.value++;
  } else {
    currentChallengeIndex.value = 0;
  }
};
const handleDeleteExercise = async (recordIds?: number[]) => {
  if (!recordIds || recordIds.length === 0) return;

  if (!confirm("선택한 운동 기록을 모두 삭제하시겠습니까?")) return;

  try {
    const promises = recordIds.map((id) => exerciseApi.deleteMyExerciseRecord(id));
    await Promise.all(promises);
    await fetchTodayExercises();
  } catch (e) {
    console.error("Failed to delete records", e);
    alert("운동 기록 삭제에 실패했습니다.");
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- 상단 영역 - 오늘의 요약 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div class="flex items-center gap-2 h-8">
        <Activity class="w-5 h-5 text-zinc-400" />
        <h2 class="text-xl text-white leading-none">오늘의 요약</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- 1. 섭취 칼로리 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between">
          <div class="text-zinc-400 text-base">섭취 칼로리</div>
          <div class="text-2xl text-white font-bold">
            {{ dailyStats.intakeCalories }} <span class="text-base text-zinc-500 font-normal">kcal</span>
          </div>
        </div>

        <!-- 2. 섭취 영양소 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between">
          <div class="text-zinc-400 text-base">섭취 영양소</div>
          <div class="flex flex-col items-end gap-1">
            <div class="text-2xl text-white font-bold">
              {{ dailyStats.macros.carbs + dailyStats.macros.protein + dailyStats.macros.fat }}
              <span class="text-base text-zinc-500 font-normal">g</span>
            </div>
            <div class="text-sm text-zinc-500 font-medium">
              탄 {{ dailyStats.macros.carbs }} · 단 {{ dailyStats.macros.protein }} · 지 {{ dailyStats.macros.fat }}
            </div>
          </div>
        </div>

        <!-- 3. 운동 소모 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between">
          <div class="text-zinc-400 text-base">운동 소모</div>
          <div class="text-2xl text-white font-bold">
            {{ dailyStats.exerciseCalories }} <span class="text-base text-zinc-500 font-normal">kcal</span>
          </div>
        </div>

        <!-- 4. 운동 시간 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-xl py-6 px-5 flex items-center justify-between">
          <div class="text-zinc-400 text-base">운동 시간</div>
          <div class="text-2xl text-white font-bold">
            {{ dailyStats.exerciseTime }} <span class="text-base text-zinc-500 font-normal">min</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 중간 영역 - 좌: AI 식단 / 우: 챌린지 캐러셀 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 좌측: AI 추천 식단 계획 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full flex flex-col">
        <div class="flex items-center gap-2 h-8">
          <Sparkles class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl text-white leading-none">AI 추천 식단 계획</h2>
        </div>

        <div v-if="isAiLoading" class="flex-1 flex items-center justify-center text-zinc-500">
          식단을 생성하고 있습니다...
        </div>

        <div v-else-if="aiMealPlan" class="flex-1 flex flex-col justify-between gap-4">
          <!-- 아침 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">아침</div>
            </div>
            <div class="text-white">{{ aiMealPlan.breakfast.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ Math.round(aiMealPlan.breakfast.calories) }}kcal · {{ aiMealPlan.breakfast.comment }}
            </div>
          </div>

          <!-- 점심 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">점심</div>
            </div>
            <div class="text-white">{{ aiMealPlan.lunch.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ Math.round(aiMealPlan.lunch.calories) }}kcal · {{ aiMealPlan.lunch.comment }}
            </div>
          </div>

          <!-- 저녁 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">저녁</div>
            </div>
            <div class="text-white">{{ aiMealPlan.dinner.menu }}</div>
            <div class="text-sm text-zinc-400">
              {{ Math.round(aiMealPlan.dinner.calories) }}kcal · {{ aiMealPlan.dinner.comment }}
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-zinc-500">식단 정보를 불러오지 못했습니다.</div>
      </div>

      <!-- 우측: 참여 중인 챌린지 (캐러셀) -->
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full relative overflow-hidden group"
      >
        <!-- 배경 이미지 (Blur) -->
        <div
          class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm pointer-events-none transition-all duration-500"
          :style="{ backgroundImage: `url(${currentChallenge.image})` }"
        ></div>

        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-4 h-8">
            <div class="flex items-center gap-2">
              <Trophy class="w-5 h-5 text-amber-400" />
              <h2 class="text-xl text-white leading-none">참여 중인 챌린지</h2>
            </div>

            <!-- Carousel Controls -->
            <div class="flex items-center gap-2">
              <button
                @click="prevChallenge"
                class="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft class="w-6 h-6" />
              </button>
              <span class="text-sm text-zinc-500">{{ currentChallengeIndex + 1 }} / {{ activeChallenges.length }}</span>
              <button
                @click="nextChallenge"
                class="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronRight class="w-6 h-6" />
              </button>
            </div>
          </div>

          <!-- Challenge Content -->
          <div class="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <!-- Image Wrapper -->
            <div class="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-zinc-700">
              <img :src="currentChallenge.image" class="w-full h-full object-cover" alt="Challenge" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div class="absolute bottom-4 left-4 text-left">
                <div class="text-amber-400 text-sm font-bold mb-1">진행 중 🔥</div>
                <h3 class="text-2xl text-white font-bold">{{ currentChallenge.title }}</h3>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-4 w-full">
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">진행도</div>
                <div class="text-lg font-bold text-emerald-400">{{ currentChallenge.progress }}%</div>
              </div>
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">성공 일수</div>
                <div class="text-lg font-bold text-white">
                  {{ currentChallenge.currentDay }}/{{ currentChallenge.totalDays }}일
                </div>
              </div>
              <div class="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <div class="text-xs text-zinc-400">남은 기간</div>
                <div class="text-lg font-bold text-blue-400">D-{{ currentChallenge.dDay }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 영역 - 오늘의 루틴 타임라인 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 h-8">
          <Clock class="w-5 h-5 text-zinc-400" />
          <h2 class="text-xl text-white leading-none">오늘의 루틴 타임라인</h2>
        </div>
        <div class="flex gap-3">
          <Button @click="navigateTo('/meal-register')" class="bg-emerald-500 hover:bg-emerald-600 text-white">
            식단 추가하기
          </Button>
          <Button @click="navigateTo('/exercise-register')" class="bg-blue-500 hover:bg-blue-600 text-white">
            운동 추가하기
          </Button>
        </div>
      </div>

      <!-- 타임라인 -->
      <div class="relative pl-24">
        <!-- 세로 라인 -->
        <div class="absolute left-[88px] top-0 bottom-0 w-0.5 bg-zinc-800"></div>

        <!-- 타임라인 아이템들 (Unified) -->
        <div class="space-y-6">
          <div v-for="item in timelineItems" :key="item.id" class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">{{ item.time }}</div>

            <!-- Dot (Color based on Type) -->
            <div
              class="absolute left-[-7px] w-3 h-3 rounded-full border-2 border-zinc-950"
              :class="item.colorClass === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'"
            ></div>

            <div class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="
                    item.colorClass === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                      : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                  "
                >
                  <component
                    :is="item.icon"
                    class="w-8 h-8"
                    :class="item.colorClass === 'emerald' ? 'text-emerald-500' : 'text-blue-500'"
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">
                    {{ item.title }} <span v-if="item.time" class="text-zinc-500 font-normal">· {{ item.time }}</span>
                  </h3>
                  <p class="text-zinc-300">{{ item.desc }}</p>
                  <p class="text-sm text-zinc-400">{{ item.subDesc }}</p>
                  <div class="flex gap-4 pt-2">
                    <button
                      v-if="item.type === 'EXERCISE' && item.recordIds"
                      @click="
                        router.push({
                          path: '/exercise-register',
                          query: { mode: 'edit', ids: item.recordIds.join(',') },
                        })
                      "
                      class="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      수정
                    </button>
                    <button
                      v-if="item.type === 'EXERCISE' && item.recordIds"
                      @click="handleDeleteExercise(item.recordIds)"
                      class="text-sm text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="timelineItems.length === 0" class="relative flex gap-6 items-center">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">...</div>
            <div class="flex-1 p-5 text-center text-zinc-500 text-sm">오늘의 기록이 없습니다.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
