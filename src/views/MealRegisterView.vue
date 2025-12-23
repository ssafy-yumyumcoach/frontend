<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Upload, Trash2, X } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import Select from "@/components/ui/Select.vue";
import ToggleGroup from "@/components/ui/ToggleGroup.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";
import { useFoodsStore } from "@/stores/foods";
import { useDietStore } from "@/stores/diet";
import Textarea from "@/components/ui/Textarea.vue";
import { type UpdateMyDietItemRequest } from "@/api/diet";
import dietApi from "@/api/diet";
import statsApi from "@/api/stats";

const router = useRouter();
const route = useRoute();
const foodsStore = useFoodsStore();
const dietStore = useDietStore();

// Edit mode
const isEditMode = computed(() => route.query.mode === 'edit' && route.query.dietId);
const editDietId = computed(() => {
  const dietId = route.query.dietId;
  return dietId ? Number(dietId) : null;
});

// Types
interface FoodItem {
  id: string;
  foodId?: number | null;
  name: string;
  checked: boolean;
  amount: number;
  unit: "g";
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  manualInput: boolean;
}

// State
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const selectedTime = ref("12:30");
const selectedMealType = ref("lunch");
const hasPhoto = ref(false);
const uploadedPhotoUrl = ref("");
const foods = ref<FoodItem[]>([]);
const memo = ref("");

// Foods Catalog (GET /api/foods)
const catalogKeyword = ref("");
const selectedCatalogFoodId = ref<string>("");
const saveErrorMessage = ref("");

// Options
const mealTypeOptions = [
  { label: "아침", value: "breakfast" },
  { label: "점심", value: "lunch" },
  { label: "저녁", value: "dinner" },
  { label: "간식", value: "snack" },
];

const servingOptions = [
  // 명세에 맞춰 unit=g 기준으로 고정 (추후 단위 확장 가능)
  { label: "50 g", value: "50" },
  { label: "100 g", value: "100" },
  { label: "150 g", value: "150" },
  { label: "200 g", value: "200" },
];

// Computed
const mealTypeLabel = computed(() => {
  const option = mealTypeOptions.find((o) => o.value === selectedMealType.value);
  return option ? option.label : "점심";
});

const totalNutrition = computed(() => {
  return foods.value
    .filter((food) => food.checked)
    .reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        carbs: acc.carbs + food.carbs,
        protein: acc.protein + food.protein,
        fat: acc.fat + food.fat,
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );
});

const catalogFoodOptions = computed(() => {
  return foodsStore.foods.map((f) => ({
    label: `${f.name} · ${f.calories}kcal`,
    value: String(f.id),
  }));
});

// Actions
const fetchCatalogFoods = async () => {
  await foodsStore.fetchFoods({
    keyword: catalogKeyword.value.trim() || undefined,
  });
};

const loadDietForEdit = async () => {
  if (!isEditMode.value || !editDietId.value) return;

  try {
    // getMyDietDetail로 상세 정보 가져오기
    const diet = await dietStore.getMyDietDetail(editDietId.value);

    // 날짜 설정
    if (diet.date) {
      selectedDate.value = diet.date;
    }

    // createdAt에서 시간 추출
    if (diet.createdAt) {
      const dateTime = new Date(diet.createdAt);
      const hours = String(dateTime.getHours()).padStart(2, '0');
      const minutes = String(dateTime.getMinutes()).padStart(2, '0');
      selectedTime.value = `${hours}:${minutes}`;
    } else {
      // createdAt이 없으면 timeSlot에 따라 기본 시간 설정
      switch (diet.timeSlot) {
        case 'BREAKFAST':
          selectedTime.value = '08:00';
          break;
        case 'LUNCH':
          selectedTime.value = '12:30';
          break;
        case 'DINNER':
          selectedTime.value = '19:00';
          break;
        case 'SNACK':
          selectedTime.value = '15:00';
          break;
      }
    }

    // 식사 타입 설정
    switch (diet.timeSlot) {
      case 'BREAKFAST':
        selectedMealType.value = 'breakfast';
        break;
      case 'LUNCH':
        selectedMealType.value = 'lunch';
        break;
      case 'DINNER':
        selectedMealType.value = 'dinner';
        break;
      case 'SNACK':
        selectedMealType.value = 'snack';
        break;
    }

    // 메모 설정
    if (diet.memo) {
      memo.value = diet.memo;
    }

    // 음식 목록 설정
    if (diet.items && Array.isArray(diet.items)) {
      foods.value = diet.items.map((item, idx: number) => ({
        id: `edit-${item.dietItemId || idx}`,
        foodId: item.foodId || null,
        name: item.name || '',
        checked: true,
        amount: item.amount || 100,
        unit: 'g' as const,
        calories: item.calories || 0,
        carbs: 0, // 상세 정보가 없으면 0
        protein: 0,
        fat: 0,
        manualInput: false,
      }));
    }
  } catch (e: any) {
    console.error('Failed to load diet for edit', e);
    saveErrorMessage.value = dietStore.errorMessage || "식단 정보를 불러오는데 실패했습니다.";
  }
};

onMounted(async () => {
  // 최초 진입 시 전체 음식 목록 로드
  await fetchCatalogFoods().catch(() => {
    // errorMessage는 store에 저장되므로 여기서는 무시
  });

  // 수정 모드인 경우 식단 데이터 로드
  if (isEditMode.value) {
    await loadDietForEdit();
  }
});

const handlePhotoUpload = () => {
  hasPhoto.value = true;
  uploadedPhotoUrl.value = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
  foods.value = [
    {
      id: "1",
      foodId: null,
      name: "밥",
      checked: true,
      amount: 150,
      unit: "g",
      calories: 250,
      carbs: 45,
      protein: 4,
      fat: 1,
      manualInput: false,
    },
    {
      id: "2",
      foodId: null,
      name: "치킨 샐러드",
      checked: true,
      amount: 200,
      unit: "g",
      calories: 320,
      carbs: 25,
      protein: 20,
      fat: 15,
      manualInput: false,
    },
    {
      id: "3",
      foodId: null,
      name: "고구마",
      checked: true,
      amount: 100,
      unit: "g",
      calories: 110,
      carbs: 10,
      protein: 6,
      fat: 4,
      manualInput: false,
    },
  ];
};

const handlePhotoDelete = () => {
  hasPhoto.value = false;
  uploadedPhotoUrl.value = "";
  foods.value = [];
};

const handleToggleFood = (id: string) => {
  const food = foods.value.find((f) => f.id === id);
  if (food) food.checked = !food.checked;
};

const handleDeleteFood = (id: string) => {
  foods.value = foods.value.filter((f) => f.id !== id);
};

const handleToggleManualInput = (id: string) => {
  const food = foods.value.find((f) => f.id === id);
  if (food) food.manualInput = !food.manualInput;
};

const handleAddManualFood = () => {
  const newId = (foods.value.length + 1).toString();
  foods.value.push({
    id: newId,
    foodId: null,
    name: "새 음식",
    checked: true,
    amount: 100,
    unit: "g",
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    manualInput: true,
  });
};

const handleAddCatalogFood = async () => {
  if (!selectedCatalogFoodId.value) return;
  const foodId = Number(selectedCatalogFoodId.value);
  if (!Number.isFinite(foodId)) return;

  // 상세 조회로 영양정보 확정 (캐시 있으면 즉시 반환)
  const selected = await foodsStore.fetchFoodDetail(foodId);

  foods.value.push({
    id: `catalog-${selected.id}-${Date.now()}`,
    foodId: selected.id,
    name: selected.name,
    checked: true,
    amount: 100,
    unit: "g",
    calories: selected.calories,
    carbs: selected.carbohydrate,
    protein: selected.protein,
    fat: selected.fat,
    manualInput: false,
  });

  selectedCatalogFoodId.value = "";
};

const toTimeSlot = (mealType: string) => {
  switch (mealType) {
    case "breakfast":
      return "BREAKFAST";
    case "lunch":
      return "LUNCH";
    case "dinner":
      return "DINNER";
    case "snack":
      return "SNACK";
    default:
      return "LUNCH";
  }
};

const toRecordedAt = (date: string, time: string) => {
  // time: "HH:mm" -> "HH:mm:00"
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}`;
};

const handleSave = async () => {
  saveErrorMessage.value = "";

  const selectedItems = foods.value.filter((f) => f.checked);
  if (selectedItems.length === 0) {
    saveErrorMessage.value = "저장할 음식이 없습니다. 최소 1개 이상 선택해주세요.";
    return;
  }

  // 백엔드 제약: diet_foods.food_id NOT NULL
  // - foodId가 없는(수동 입력/사진 인식 더미) 항목은 서버에서 저장 불가
  // - 가능한 경우, 현재 로드된 foods 목록에서 이름으로 매칭해 foodId를 채웁니다.
  for (const item of selectedItems) {
    if (!item.name?.trim()) {
      saveErrorMessage.value = "음식 이름이 비어있는 항목이 있어요. 이름을 입력해주세요.";
      return;
    }
    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      saveErrorMessage.value = "수량(amount)은 0보다 커야 합니다.";
      return;
    }

    if (item.foodId == null) {
      const normalized = item.name.trim().toLowerCase();
      const matched = foodsStore.foods.find((f) => f.name.trim().toLowerCase() === normalized);
      if (matched) {
        item.foodId = matched.id;
      }
    }
  }

  const missingFoodId = selectedItems.filter((f) => f.foodId == null);
  if (missingFoodId.length > 0) {
    saveErrorMessage.value =
      "현재 서버 정책상 직접 추가한 음식은 저장할 수 없어요. 음식 DB에서 동일한 이름의 음식을 선택해 추가하거나, 백엔드에서 diet_foods.food_id를 nullable로 변경/별도 저장 방식을 지원해야 합니다.";
    return;
  }

  try {
    if (isEditMode.value && editDietId.value) {
      // 수정 모드
      const updatePayload: UpdateMyDietItemRequest[] = selectedItems.map((f) => ({
        foodId: f.foodId!,
        name: f.name,
        amount: f.amount,
        unit: 'g',
      }));

      await dietStore.updateMyDiet(editDietId.value, {
        date: selectedDate.value,
        timeSlot: toTimeSlot(selectedMealType.value),
        items: updatePayload,
        memo: memo.value.trim() ? memo.value.trim() : undefined,
      });
    } else {
      // 생성 모드
      await dietStore.createMyDiet({
        recordedAt: toRecordedAt(selectedDate.value, selectedTime.value),
        mealType: toTimeSlot(selectedMealType.value),
        items: selectedItems.map((f, idx) => ({
          foodId: f.foodId ?? null,
          name: f.name,
          serveCount: f.amount,
          orderIndex: idx + 1,
        })),
        memo: memo.value.trim() ? memo.value.trim() : undefined,
      });
    }
    router.push("/dashboard");
  } catch (e: any) {
    saveErrorMessage.value = e?.message || dietStore.errorMessage || "식단 저장 중 오류가 발생했습니다.";
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 상단 - 메타 정보 -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-end gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 날짜 선택 -->
        <div class="relative">
          <Input type="date" v-model="selectedDate" class="w-[150px] bg-zinc-900 border-zinc-800 text-white text-sm" />
        </div>

        <!-- 시간 선택 -->
        <Input type="time" v-model="selectedTime" class="w-[110px] bg-zinc-900 border-zinc-800 text-white text-sm" />

        <!-- 끼니 선택 -->
        <ToggleGroup v-model="selectedMealType" :options="mealTypeOptions" class="h-10" />
      </div>
    </div>

    <!-- 좌우 2열 레이아웃 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 좌측 - 식단 사진 업로드 & 미리보기 -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div
            v-if="!hasPhoto"
            class="flex flex-col items-center justify-center py-16 space-y-4 border-2 border-dashed border-zinc-700 rounded-lg aspect-square"
          >
            <div class="text-6xl">🍽</div>
            <p class="text-zinc-400 text-center">
              식단 사진을 업로드하면,<br />
              AI가 음식과 영양 정보를 분석해줘요.
            </p>
            <Button @click="handlePhotoUpload" class="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Upload class="w-4 h-4 mr-2" />
              사진 업로드
            </Button>
          </div>
          <div v-else>
            <div class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <ImageWithFallback :src="uploadedPhotoUrl" alt="업로드된 식단 사진" class="w-full h-full object-cover" />

              <!-- 버튼 오버레이 -->
              <div class="absolute top-4 right-4 flex gap-2">
                <Button size="sm" class="bg-black/60 hover:bg-black/80 text-white border-0" @click="handlePhotoUpload">
                  <Upload class="w-4 h-4 mr-2" />
                  사진 변경
                </Button>
                <Button size="sm" class="bg-black/60 hover:bg-black/80 text-white border-0" @click="handlePhotoDelete">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>

            <!-- AI 인식 상태 -->
            <div class="flex items-center gap-2 text-emerald-400 mt-4">
              <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span class="text-sm">{{ foods.length }}개의 음식을 인식했어요.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 - AI 인식 결과 + 음식 리스트 -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <!-- 헤더 -->
          <div class="space-y-3 pb-4 border-b border-zinc-800">
            <div class="flex items-center justify-between">
              <h3 class="text-lg text-white">이번 식단에 들어간 음식</h3>
              <span class="text-xs text-zinc-500"> 체크된 음식만 기록에 저장돼요. </span>
            </div>
            <p class="text-sm text-zinc-400">
              AI가 사진에서 인식한 음식에, 직접 추가/수정한 음식도 함께 기록할 수 있어요.
            </p>
          </div>

          <!-- 음식 DB에서 추가하기 (/api/foods) -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Input
                v-model="catalogKeyword"
                placeholder="음식 검색 (예: 닭가슴살)"
                class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                @keyup.enter="fetchCatalogFoods"
              />
              <Button
                type="button"
                variant="outline"
                class="h-10 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 whitespace-nowrap"
                :disabled="foodsStore.isLoading"
                @click="fetchCatalogFoods"
              >
                검색
              </Button>
            </div>

            <div v-if="foodsStore.errorMessage" class="text-sm text-red-400">
              {{ foodsStore.errorMessage }}
            </div>

            <div class="flex items-center gap-2">
              <Select
                :model-value="selectedCatalogFoodId"
                @update:model-value="(val) => (selectedCatalogFoodId = val)"
                :options="catalogFoodOptions"
                :disabled="foodsStore.isLoading || catalogFoodOptions.length === 0"
                placeholder="음식을 선택하세요"
                class="h-10 bg-zinc-900 border-zinc-800 text-white"
              />
              <Button
                type="button"
                class="h-10 bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                :disabled="foodsStore.isLoading || !selectedCatalogFoodId"
                @click="handleAddCatalogFood"
              >
                추가
              </Button>
            </div>

            <div v-if="foodsStore.isLoading" class="text-xs text-zinc-500">음식 목록 불러오는 중...</div>
            <div v-else-if="catalogFoodOptions.length === 0" class="text-xs text-zinc-500">
              음식 목록이 비어있어요.
            </div>
          </div>

          <!-- 음식 리스트 -->
          <div class="space-y-3">
            <div
              v-for="food in foods"
              :key="food.id"
              class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2"
            >
              <!-- 상단: 체크박스 + 음식명 + 수량/인분 + 삭제 -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 flex-1">
                  <Checkbox
                    :id="`food-${food.id}`"
                    :checked="food.checked"
                    @update:checked="() => handleToggleFood(food.id)"
                  />

                  <Input
                    v-if="food.manualInput"
                    v-model="food.name"
                    class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm flex-1 min-w-0"
                    placeholder="음식 이름"
                  />
                  <label v-else :for="`food-${food.id}`" class="text-white cursor-pointer flex-1">
                    {{ food.name }}
                  </label>

                  <span
                    v-if="food.manualInput && !food.name"
                    class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded whitespace-nowrap"
                  >
                    수동 입력
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <!-- 수량 드롭다운 -->
                  <Select
                    :model-value="food.amount.toString()"
                    @update:model-value="(val) => (food.amount = Number(val))"
                    :options="servingOptions"
                    class="w-[100px] h-9 text-xs bg-zinc-900 border-zinc-700 text-white"
                  />

                  <button @click="handleDeleteFood(food.id)" class="text-zinc-500 hover:text-red-400 transition-colors">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- 영양 정보 요약 (수동 입력 모드가 아닐 때만) -->
              <div v-if="!food.manualInput" class="text-sm text-zinc-400">
                {{ food.calories }} kcal · 탄 {{ food.carbs }}g · 단백질 {{ food.protein }}g · 지방 {{ food.fat }}g
              </div>

              <!-- 수동 입력 모드일 때: 입력 필드 -->
              <div v-if="food.manualInput" class="grid grid-cols-2 gap-2 pt-1">
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">열량 (kcal)</label>
                  <Input
                    type="number"
                    v-model="food.calories"
                    class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">탄수화물 (g)</label>
                  <Input
                    type="number"
                    v-model="food.carbs"
                    class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">단백질 (g)</label>
                  <Input
                    type="number"
                    v-model="food.protein"
                    class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs text-zinc-500">지방 (g)</label>
                  <Input type="number" v-model="food.fat" class="h-8 bg-zinc-900 border-zinc-700 text-white text-sm" />
                </div>
              </div>

              <!-- 하단: 영양 정보 직접 입력 버튼 -->
              <div class="flex justify-end pt-1">
                <button
                  @click="handleToggleManualInput(food.id)"
                  class="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  {{ food.manualInput ? "자동 입력으로 돌아가기" : "영양 정보 직접 입력하기" }}
                </button>
              </div>
            </div>
          </div>

          <!-- 음식 직접 추가하기 -->
          <button
            @click="handleAddManualFood"
            class="w-full py-4 border-2 border-dashed border-zinc-700 rounded-lg text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
          >
            <span class="text-xl">+</span>
            <span>음식 직접 추가하기</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 하단 - 식단 요약 & 저장 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- 요약 정보 -->
        <div class="space-y-3 flex-1">
          <h3 class="text-xl text-white">오늘 {{ mealTypeLabel }} 식단 요약</h3>
          <div class="space-y-2">
            <p class="text-2xl text-emerald-400">총 섭취 예상 칼로리: {{ totalNutrition.calories }} kcal</p>
            <p class="text-zinc-300">
              탄수화물: {{ totalNutrition.carbs }}g / 단백질: {{ totalNutrition.protein }}g / 지방:
              {{ totalNutrition.fat }}g
            </p>
          </div>

          <div class="space-y-2 pt-2">
            <p class="text-sm text-zinc-400">메모 (선택)</p>
            <Textarea v-model="memo" placeholder="운동 전 아침 식사" :rows="3" />
          </div>

          <p v-if="saveErrorMessage || dietStore.errorMessage" class="text-sm text-red-400">
            {{ saveErrorMessage || dietStore.errorMessage }}
          </p>
        </div>

        <!-- 저장 버튼 -->
        <div class="flex gap-3">
          <Button
            @click="router.push('/dashboard')"
            variant="outline"
            class="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            :disabled="dietStore.isCreating"
          >
            취소
          </Button>
          <Button
            type="button"
            @click="handleSave"
            class="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
            :disabled="dietStore.isCreating || dietStore.isUpdating"
          >
            <span v-if="dietStore.isCreating || dietStore.isUpdating">
              {{ isEditMode ? '수정 중...' : '저장 중...' }}
            </span>
            <span v-else>{{ isEditMode ? '수정하기' : '이 식단으로 기록하기' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
