<script setup lang="ts">
import { useRouter } from "vue-router";
import { Sparkles, Utensils, Dumbbell } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";

const router = useRouter();

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="space-y-8">
    <!-- 상단 영역 - 오늘 요약 + 식단 평가 -->
    <div class="space-y-6">
      <!-- 오늘의 요약 섹션 -->
      <div class="space-y-4">
        <h2 class="text-xl text-white">오늘의 요약</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- 섭취 칼로리 카드 -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div class="text-zinc-400 text-sm">오늘 섭취 칼로리</div>
            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl text-white">1,350</span>
                <span class="text-zinc-500">/ 1,800 kcal</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 75%"></div>
              </div>
              <div class="text-xs text-zinc-500">목표의 75%</div>
            </div>
          </div>

          <!-- 운동 소모 칼로리 카드 -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div class="text-zinc-400 text-sm">오늘 운동 소모</div>
            <div class="space-y-1">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl text-white">320</span>
                <span class="text-zinc-500">/ 400 kcal</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full" style="width: 80%"></div>
              </div>
              <div class="text-xs text-zinc-500">목표의 80%</div>
            </div>
          </div>

          <!-- 챌린지 진행률 카드 -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div class="text-zinc-400 text-sm">참여 중인 챌린지</div>
            <div class="space-y-1">
              <div class="text-xl text-white">2주 저녁 샐러드</div>
            </div>
            <div class="space-y-2">
              <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full" style="width: 45%"></div>
              </div>
              <div class="text-xs text-zinc-500">45% 완료 (6/14일)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 중간 영역 - 오늘 식단 계획 + 식단 평가 + AI 코치 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 오늘 식단 계획 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-full">
        <div class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl text-white">AI 추천 식단 계획</h2>
        </div>
        <div class="space-y-3">
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

      <!-- 우측: 식단 평가 + AI 코치 -->
      <div class="space-y-4 flex flex-col">
        <!-- 오늘 식단 평가 카드 -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 flex-1">
          <div class="flex items-center justify-between">
            <div class="text-zinc-400 text-sm">오늘 식단 평가</div>
            <div class="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs">
              평가 완료
            </div>
          </div>
          <div class="space-y-1">
            <div class="flex items-baseline gap-2">
              <span class="text-4xl text-white">B</span>
              <span class="text-zinc-400">등급</span>
              <span class="text-zinc-600 ml-auto">72점</span>
            </div>
          </div>
          <div class="space-y-2 pt-2">
            <p class="text-sm text-zinc-300">단백질은 적당하지만 섬유질이 조금 부족해요.</p>
            <p class="text-sm text-emerald-400">💡 저녁에 채소 반찬을 한 가지 추가해보세요.</p>
          </div>
          <button
            @click="navigateTo('/stats-analysis')"
            class="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors mt-auto"
          >
            자세한 통계 보러가기 →
          </button>
        </div>

        <!-- AI 코치 한 줄 -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 flex-1">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-emerald-500" />
            <div class="text-zinc-400 text-sm">AI 코치 한 줄</div>
          </div>
          <p class="text-white">이번 주는 저녁 식단 조절과 가벼운 유산소 운동을 함께 가져가면 좋아요.</p>

          <div class="space-y-2 pt-2">
            <div class="text-xs text-zinc-500">예시 질문:</div>
            <div class="space-y-1.5">
              <div class="text-xs text-zinc-400 pl-3 border-l-2 border-zinc-700">오늘 저녁 식단 이대로 괜찮을까?</div>
              <div class="text-xs text-zinc-400 pl-3 border-l-2 border-zinc-700">허리 아픈데 어떤 운동이 좋을까?</div>
            </div>
          </div>

          <Button
            @click="navigateTo('/ai-coach')"
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-auto"
          >
            AI 코치와 상담하기
          </Button>
        </div>
      </div>
    </div>

    <!-- 하단 영역 - 오늘의 루틴 타임라인 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl text-white">오늘의 루틴 타임라인</h2>
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

            <div class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
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

            <div class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
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

            <div class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
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

            <div class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
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
