<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Sparkles, Utensils, Dumbbell, ChevronLeft, ChevronRight, Trophy, Activity, Clock } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";

const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};

// Dummy Data for Top Stats
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
      <!-- 좌측: AI 추천 식단 계획 (유지) -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full flex flex-col">
        <div class="flex items-center gap-2 h-8">
          <Sparkles class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl text-white leading-none">AI 추천 식단 계획</h2>
        </div>
        <div class="flex-1 flex flex-col justify-between gap-4">
          <!-- 아침 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">아침</div>
            </div>
            <div class="text-white">현미밥 + 닭가슴살 + 샐러드</div>
            <div class="text-sm text-zinc-400">약 550kcal · 단백질 위주</div>
          </div>

          <!-- 점심 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">점심</div>
            </div>
            <div class="text-white">연어 구이 + 퀴노아 + 브로콜리</div>
            <div class="text-sm text-zinc-400">약 650kcal · 오메가3 풍부</div>
          </div>

          <!-- 저녁 -->
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">저녁</div>
            </div>
            <div class="text-white">두부 스테이크 + 고구마 + 애호박 볶음</div>
            <div class="text-sm text-zinc-400">약 480kcal · 저칼로리 고단백</div>
          </div>
        </div>
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

        <!-- 타임라인 아이템들 -->
        <div class="space-y-6">
          <!-- 08:10 - 아침 식단 -->
          <div class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">08:10</div>
            <div class="absolute left-[-7px] w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>

            <div class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Utensils class="w-8 h-8 text-emerald-500" />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">아침 식단 · 08:10</h3>
                  <p class="text-zinc-300">밥, 계란후라이, 김치</p>
                  <p class="text-sm text-zinc-400">540 kcal · 탄 65g · 단백질 18g · 지방 15g</p>
                  <div class="flex gap-4 pt-2">
                    <button class="text-sm text-zinc-400 hover:text-white transition-colors">수정</button>
                    <button class="text-sm text-zinc-400 hover:text-red-400 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 12:30 - 점심 식단 -->
          <div class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">12:30</div>
            <div class="absolute left-[-7px] w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>

            <div class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Utensils class="w-8 h-8 text-emerald-500" />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">점심 식단 · 12:30</h3>
                  <p class="text-zinc-300">치킨 샐러드, 고구마, 방울토마토</p>
                  <p class="text-sm text-zinc-400">650 kcal · 탄 45g · 단백질 38g · 지방 22g</p>
                  <div class="flex gap-4 pt-2">
                    <button class="text-sm text-zinc-400 hover:text-white transition-colors">수정</button>
                    <button class="text-sm text-zinc-400 hover:text-red-400 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 17:00 - 간식 -->
          <div class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">17:00</div>
            <div class="absolute left-[-7px] w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>

            <div class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Utensils class="w-8 h-8 text-emerald-500" />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">간식 · 17:00</h3>
                  <p class="text-zinc-300">바나나, 아몬드</p>
                  <p class="text-sm text-zinc-400">160 kcal · 탄 25g · 단백질 4g · 지방 6g</p>
                  <div class="flex gap-4 pt-2">
                    <button class="text-sm text-zinc-400 hover:text-white transition-colors">수정</button>
                    <button class="text-sm text-zinc-400 hover:text-red-400 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 20:00 - 운동 -->
          <div class="relative flex gap-6">
            <div class="absolute -left-24 text-zinc-400 w-16 text-right">20:00</div>
            <div class="absolute left-[-7px] w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-950"></div>

            <div class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Dumbbell class="w-8 h-8 text-blue-500" />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="text-white">운동 · 20:00</h3>
                  <p class="text-zinc-300">런닝 30분, 스쿼트 3세트</p>
                  <p class="text-sm text-zinc-400">320 kcal 소모</p>
                  <div class="flex gap-4 pt-2">
                    <button class="text-sm text-zinc-400 hover:text-white transition-colors">수정</button>
                    <button class="text-sm text-zinc-400 hover:text-red-400 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
