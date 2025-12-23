<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Sparkles, Dumbbell, ChevronLeft, ChevronRight, Trophy, Activity, Clock, Utensils } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import exerciseApi, { type ExerciseRecordListItem, type ExerciseRecordDetail } from "@/api/exercise/index";
import { useDietStore } from "@/stores/diet";
import aiApi, { type MealPlanResponse } from "@/api/ai/index";
import statsApi from "@/api/stats";
import challengeApi, { type ChallengeSummary } from "@/api/challenge";

const router = useRouter();
const dietStore = useDietStore();

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

// --- Daily Diet Records Integration ---
interface DietRecord {
  dietId: number;
  recordedAt: string;
  mealType: string;
  items: Array<{ name: string; serveCount: number }>;
  totalCalories?: number;
}

const todayDiets = ref<DietRecord[]>([]);

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

// 식단 목록을 저장할 ref (식단별로 표시용)
const displayedDiets = ref<
  Array<{
    dietId: number;
    timeSlot: string;
    timeSlotLabel: string;
    time: string; // HH:mm 형식
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    items: Array<{ name: string; amount: number; calories: number; carbs: number; protein: number; fat: number }>;
  }>
>([]);

const fetchTodayDiets = async () => {
  try {
    const today = getTodayDate();
    console.log("📅 [Dashboard] 오늘 날짜:", today);
    console.log("📞 [Dashboard] getMyDiets API 호출 시작");
    const res = await dietStore.getMyDiets(today);
    console.log("✅ [Dashboard] getMyDiets API 응답:", res);
    console.log("✅ [Dashboard] res 타입:", typeof res);
    console.log("✅ [Dashboard] res가 배열인가?", Array.isArray(res));
    console.log("✅ [Dashboard] res.diets:", res.diets);

    // API 응답 구조에 따라 유연하게 처리
    let diets: any[] = [];
    if (Array.isArray(res)) {
      // 백엔드가 직접 배열을 반환하는 경우
      console.log("✅ [Dashboard] 배열로 직접 반환됨");
      diets = res;
    } else if (res && typeof res === "object" && res.diets && Array.isArray(res.diets)) {
      // 백엔드가 { date, diets } 형태로 반환하는 경우
      console.log("✅ [Dashboard] { date, diets } 형태로 반환됨");
      diets = res.diets;
    } else {
      console.log("⚠️ [Dashboard] 예상치 못한 응답 구조:", res);
      diets = [];
    }

    console.log("📋 [Dashboard] 최종 diets 배열:", diets);
    console.log("📋 [Dashboard] diets 개수:", diets.length);

    // 각 diet 객체의 상세 정보 로그
    if (diets.length > 0) {
      console.log("🔍 [Dashboard] 첫 번째 diet 상세:", JSON.stringify(diets[0], null, 2));
      console.log("🔍 [Dashboard] 첫 번째 diet의 모든 키:", Object.keys(diets[0]));
      console.log("🔍 [Dashboard] 첫 번째 diet.items:", diets[0].items);
      console.log("🔍 [Dashboard] 첫 번째 diet.items 타입:", typeof diets[0].items);
      console.log("🔍 [Dashboard] 첫 번째 diet.items가 배열인가?", Array.isArray(diets[0].items));
      console.log("🔍 [Dashboard] 첫 번째 diet.items가 null인가?", diets[0].items === null);
      console.log("🔍 [Dashboard] 첫 번째 diet.items가 undefined인가?", diets[0].items === undefined);
      console.log("🔍 [Dashboard] 첫 번째 diet.totalCalories:", diets[0].totalCalories);
      console.log("🔍 [Dashboard] 첫 번째 diet.timeSlot:", diets[0].timeSlot);
      console.log("🔍 [Dashboard] 첫 번째 diet.createdAt:", diets[0].createdAt);

      // items 대신 다른 필드명을 사용하는지 확인
      console.log("🔍 [Dashboard] 첫 번째 diet.dietItems:", diets[0].dietItems);
      console.log("🔍 [Dashboard] 첫 번째 diet.foods:", diets[0].foods);
      console.log("🔍 [Dashboard] 첫 번째 diet.foodItems:", diets[0].foodItems);
    }

    // 날짜 추출 (res가 객체면 res.date, 배열이면 오늘 날짜 사용)
    const responseDate = typeof res === "object" && !Array.isArray(res) && res.date ? res.date : today;

    // Convert to DietRecord format for compatibility
    // 백엔드 응답 구조: { id, mealType, date (시간 포함), items: null, ... }
    const dietRecords: DietRecord[] = diets.map((diet: any) => {
      // items가 null이거나 undefined인 경우 빈 배열로 처리
      let items: any[] = [];

      if (diet.items !== null && diet.items !== undefined && Array.isArray(diet.items)) {
        items = diet.items;
      }

      // 백엔드 필드명 매핑: id → dietId, mealType → timeSlot
      // date 필드에 시간 정보가 포함되어 있으므로 우선 사용
      const dateTimeForRecord = diet.date || diet.recordedAt || `${responseDate}T12:00:00`;
      return {
        dietId: diet.id || diet.dietId,
        recordedAt: dateTimeForRecord,
        mealType: diet.mealType || diet.timeSlot,
        items: items.map((item: any) => ({
          name: item?.name || "",
          serveCount: item?.amount || item?.serveCount || 0,
        })),
        totalCalories: diet.totalCalories || 0,
      };
    });

    todayDiets.value = dietRecords;

    // 식단 목록 표시용 데이터 생성
    // 백엔드 응답 구조에 맞춰 필드명 매핑: id → dietId, mealType → timeSlot, recordedAt → createdAt
    displayedDiets.value = await Promise.all(
      diets.map(async (diet: any) => {
        // 백엔드 필드명 매핑
        const dietId = diet.id || diet.dietId;
        const timeSlot = diet.mealType || diet.timeSlot; // mealType이 실제 필드명
        // date 필드에 시간 정보가 포함되어 있으므로 우선 사용, 없으면 recordedAt 또는 createdAt 사용
        const dateTime = diet.date || diet.recordedAt || diet.createdAt;

        // items가 null이면 상세 조회로 가져오기
        let items: any[] = [];
        if (diet.items !== null && diet.items !== undefined && Array.isArray(diet.items)) {
          items = diet.items;
        } else if (dietId) {
          // items가 null이면 상세 조회로 가져오기
          try {
            console.log(`📞 [Dashboard] dietId ${dietId}의 상세 정보 조회 중...`);
            const detail = await dietStore.getMyDietDetail(dietId);
            console.log(`✅ [Dashboard] dietId ${dietId} 상세 조회 완료:`, detail);
            console.log(`✅ [Dashboard] detail.items:`, detail.items);
            console.log(`✅ [Dashboard] detail.items 타입:`, typeof detail.items);
            console.log(`✅ [Dashboard] detail.items가 배열인가?`, Array.isArray(detail.items));

            if (detail.items && Array.isArray(detail.items) && detail.items.length > 0) {
              items = detail.items;
              console.log(`✅ [Dashboard] dietId ${dietId}의 items 가져옴:`, items.length, "개");
              console.log(`✅ [Dashboard] 첫 번째 item:`, items[0]);
              console.log(`✅ [Dashboard] 첫 번째 item의 모든 키:`, Object.keys(items[0]));
              console.log(`✅ [Dashboard] 첫 번째 item.name:`, items[0].name);
              console.log(`✅ [Dashboard] 첫 번째 item.foodName:`, items[0].foodName);
            } else {
              console.warn(`⚠️ [Dashboard] dietId ${dietId}의 items가 비어있음 또는 배열이 아님`);
            }
          } catch (e) {
            console.error(`❌ [Dashboard] dietId ${dietId} 상세 조회 실패:`, e);
          }
        }

        let timeSlotLabel = "";
        switch (timeSlot) {
          case "BREAKFAST":
            timeSlotLabel = "아침";
            break;
          case "LUNCH":
            timeSlotLabel = "점심";
            break;
          case "DINNER":
            timeSlotLabel = "저녁";
            break;
          case "SNACK":
            timeSlotLabel = "간식";
            break;
          default:
            timeSlotLabel = timeSlot || "식단";
        }

        // 시간 추출 (date 필드에 시간 정보가 포함되어 있음)
        let timeStr = "12:00";
        if (dateTime) {
          try {
            const date = new Date(dateTime);
            if (!isNaN(date.getTime())) {
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              timeStr = `${hours}:${minutes}`;
              console.log(`✅ [Dashboard] dietId ${dietId}의 시간 추출: ${dateTime} → ${timeStr}`);
            } else {
              throw new Error("Invalid date");
            }
          } catch (e) {
            console.warn(`⚠️ [Dashboard] dietId ${dietId}의 dateTime 파싱 실패: ${dateTime}`, e);
            // dateTime 파싱 실패 시 timeSlot에 따라 기본값 사용
            switch (timeSlot) {
              case "BREAKFAST":
                timeStr = "08:00";
                break;
              case "LUNCH":
                timeStr = "12:30";
                break;
              case "DINNER":
                timeStr = "19:00";
                break;
              case "SNACK":
                timeStr = "15:00";
                break;
            }
          }
        } else {
          // dateTime이 없으면 timeSlot에 따라 기본값
          console.warn(`⚠️ [Dashboard] dietId ${dietId}의 dateTime이 없음, timeSlot 기본값 사용`);
          switch (timeSlot) {
            case "BREAKFAST":
              timeStr = "08:00";
              break;
            case "LUNCH":
              timeStr = "12:30";
              break;
            case "DINNER":
              timeStr = "19:00";
              break;
            case "SNACK":
              timeStr = "15:00";
              break;
          }
        }

        // totalCalories가 없으면 items의 calories 합계로 계산
        let totalCal = diet.totalCalories || 0;
        if (totalCal === 0 && items.length > 0) {
          totalCal = items.reduce((sum: number, item: any) => {
            const itemCal = item?.calories || 0;
            return sum + (typeof itemCal === "number" ? itemCal : 0);
          }, 0);
        }

        // 영양소 정보 추출 및 총합 계산
        const mappedItems = items.map((item: any) => {
          // name 필드가 없을 수 있으므로 여러 가능성 확인
          const itemName = item?.name || item?.foodName || item?.food?.name || "";
          console.log(`🔍 [Dashboard] item 매핑:`, {
            item,
            name: itemName,
            itemKeys: Object.keys(item || {}),
          });
          return {
            name: itemName,
            amount: item?.amount || 0,
            calories: item?.calories || 0,
            carbs: item?.carbs || item?.carbohydrate || 0,
            protein: item?.protein || 0,
            fat: item?.fat || 0,
          };
        });

        // 총 영양소 계산
        const totalCarbs = mappedItems.reduce((sum: number, item) => sum + (item.carbs || 0), 0);
        const totalProtein = mappedItems.reduce((sum: number, item) => sum + (item.protein || 0), 0);
        const totalFat = mappedItems.reduce((sum: number, item) => sum + (item.fat || 0), 0);

        return {
          dietId: dietId,
          timeSlot: timeSlot,
          timeSlotLabel: timeSlotLabel,
          time: timeStr,
          totalCalories: totalCal,
          totalCarbs: totalCarbs,
          totalProtein: totalProtein,
          totalFat: totalFat,
          items: mappedItems,
        };
      })
    );
    console.log("✅ [Dashboard] displayedDiets 설정 완료:", displayedDiets.value);
    console.log("✅ [Dashboard] displayedDiets 개수:", displayedDiets.value.length);

    // Group by TimeSlot (각 식단은 하나의 타임라인 아이템으로 표시)
    // displayedDiets에서 이미 items를 가져왔으므로 그것을 사용
    const dietTimelineItems: UnifiedTimelineItem[] = displayedDiets.value.map((diet) => {
      const desc =
        diet.items
          .map((item) => item.name)
          .filter(Boolean)
          .join(", ") || "음식 정보 없음";

      // 영양소 정보 포맷팅
      const nutritionInfo = `탄수화물 ${Math.round(diet.totalCarbs || 0)}g · 단백질 ${Math.round(
        diet.totalProtein || 0
      )}g · 지방 ${Math.round(diet.totalFat || 0)}g`;
      const subDesc = `${diet.totalCalories || 0} kcal · ${nutritionInfo}`;

      return {
        type: "MEAL",
        id: diet.dietId,
        recordIds: [diet.dietId],
        time: diet.time,
        title: diet.timeSlotLabel || "식단", // "아침", "점심", "저녁", "간식" 표시
        desc: desc,
        subDesc: subDesc,
        calories: diet.totalCalories || 0,
        colorClass: "emerald",
        icon: Utensils,
      };
    });

    // Merge with exercise items
    const exerciseTimelineItems = timelineItems.value.filter((item) => item.type === "EXERCISE");
    timelineItems.value = [...dietTimelineItems, ...exerciseTimelineItems].sort((a, b) => a.time.localeCompare(b.time));

    // Update stats (displayedDiets의 totalCalories 사용)
    const totalCalories = displayedDiets.value.reduce((sum, d) => sum + (d.totalCalories || 0), 0);
    dailyStats.intakeCalories = Math.round(totalCalories);
    console.log("✅ [Dashboard] 총 칼로리 업데이트:", dailyStats.intakeCalories);
  } catch (e) {
    console.error("❌ [Dashboard] Failed to fetch diet records", e);
    console.error("❌ [Dashboard] 에러 상세:", e);
    displayedDiets.value = [];
  }
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

    // Merge with diet items and Sort
    const dietTimelineItems = timelineItems.value.filter((item) => item.type === "MEAL");
    timelineItems.value = [...dietTimelineItems, ...exerciseTimelineItems].sort((a, b) => {
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

const handleDeleteDiet = async (dietId: number) => {
  if (!confirm("선택한 식단을 삭제하시겠습니까?")) return;

  try {
    await dietStore.deleteMyDiet(dietId);
    await fetchTodayDiets();
    await fetchTodayExercises(); // 통계 업데이트를 위해

    // AI 주간 영양 평가 생성 트리거 (비동기)
    localStorage.setItem("LAST_MEAL_UPDATE_TIME", new Date().toISOString());
    statsApi.generateNutritionReview({ anchorDate: getTodayDate() }).catch((e) => console.warn(e));
  } catch (e) {
    console.error("Failed to delete diet", e);
    alert(dietStore.errorMessage || "식단 삭제에 실패했습니다.");
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
      const genRes = await aiApi.generateMealPlan({ targetDate: today });
      aiMealPlan.value = genRes.data;
    }
  } catch (e: any) {
    // 백엔드 API가 아직 구현되지 않은 경우 404 에러를 조용히 처리
    if (e.response && e.response.status === 404) {
      // AI meal plan 기능이 아직 준비되지 않았으므로 조용히 무시
      // 콘솔 로그 제거하여 불필요한 에러 메시지 방지
      aiMealPlan.value = null;
    } else {
      // 404가 아닌 다른 에러는 개발 환경에서만 로그 출력
      if (import.meta.env.DEV) {
        console.warn("AI meal plan API 에러 (기능 미구현 가능성):", e);
      }
      aiMealPlan.value = null;
    }
  } finally {
    isAiLoading.value = false;
  }
};

onMounted(() => {
  fetchTodayDiets();
  fetchTodayExercises();
  loadMealPlan();
  fetchMyChallenges();
});

// --- Challenges (Real Data) ---
const challenges = ref<ChallengeSummary[]>([]);

const fetchMyChallenges = async () => {
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${month}`;

    // Fetch current month (and maybe next if needed, but for "Participating" usually they are active now)
    // Actually, if a challenge started last month and continues, it might show up in "current month" list if the API supports spanning?
    // Assuming getChallenges returns challenges active in that month.
    const res = await challengeApi.getChallenges(currentMonth);

    const todayStr = getTodayDate();

    // Filter: Joined AND Started (Exclude Pre-reg)
    challenges.value = res.data.challenges.filter((c) => c.isJoined && c.startDate <= todayStr);
  } catch (e) {
    console.error("Failed to fetch challenges", e);
  }
};

const activeChallenges = computed(() => {
  // Map to Dashboard UI format
  return challenges.value.map((c) => {
    const today = new Date();
    const endDate = new Date(c.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: c.challengeId,
      title: c.title,
      image: c.imageUrl,
      progress: c.progressPercentage || 0,
      currentDay: c.successDays || 0,
      totalDays: c.requiredSuccessDays || 0,
      dDay: dDay,
    };
  });
});

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

    // Trigger AI Exercise Review Generation (Fire and Forget)
    localStorage.setItem("LAST_EXERCISE_UPDATE_TIME", new Date().toISOString());
    statsApi.generateExerciseReview({ anchorDate: getTodayDate() }).catch((e) => console.warn(e));
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
        <!-- 배경 이미지 (Blur) - Only show if currentChallenge exists -->
        <div
          v-if="currentChallenge"
          class="absolute inset-0 bg-cover bg-center opacity-10 blur-sm pointer-events-none transition-all duration-500"
          :style="{ backgroundImage: `url(${currentChallenge.image})` }"
        ></div>

        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-4 h-8">
            <div class="flex items-center gap-2">
              <Trophy class="w-5 h-5 text-amber-400" />
              <h2 class="text-xl text-white leading-none">참여 중인 챌린지</h2>
            </div>

            <!-- Carousel Controls - Show only if challenges exist -->
            <div v-if="activeChallenges.length > 0" class="flex items-center gap-2">
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
          <div v-if="currentChallenge" class="flex-1 flex flex-col items-center justify-center text-center space-y-6">
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

          <!-- Empty State -->
          <div v-else class="flex-1 flex items-center justify-center text-zinc-500">참여 중인 챌린지가 없습니다.</div>
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
                    <button
                      v-if="item.type === 'MEAL' && typeof item.id === 'number'"
                      @click="
                        router.push({
                          path: '/meal-register',
                          query: { mode: 'edit', dietId: item.id },
                        })
                      "
                      class="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      수정
                    </button>
                    <button
                      v-if="item.type === 'MEAL' && typeof item.id === 'number'"
                      @click="handleDeleteDiet(item.id)"
                      :disabled="dietStore.isDeleting"
                      class="text-sm text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {{ dietStore.isDeleting ? "삭제 중..." : "삭제" }}
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
