<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Upload, Trash2, X, Calendar, Clock } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import Select from "@/components/ui/Select.vue";
import ToggleGroup from "@/components/ui/ToggleGroup.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";
import { useFoodsStore } from "@/stores/foods";
import { useDietStore } from "@/stores/diet";
import {
  type UpdateMyDietItemRequest,
  type DietTimeSlot,
  type CreateMyDietRequest,
  type UpdateMyDietRequest,
} from "@/api/diet";
import statsApi from "@/api/stats";
import { formatDecimal } from "@/lib/utils";
import detectionApi from "@/api/detection";
import imageApi from "@/api/image/index";

const router = useRouter();
const dateInputRef = ref<HTMLInputElement | null>(null);
const timeInputRef = ref<HTMLInputElement | null>(null);

const openDatePicker = () => {
  try {
    dateInputRef.value?.showPicker();
  } catch (e) {
    dateInputRef.value?.click();
  }
};

const openTimePicker = () => {
  try {
    timeInputRef.value?.showPicker();
  } catch (e) {
    timeInputRef.value?.click();
  }
};
const route = useRoute();
const foodsStore = useFoodsStore();
const dietStore = useDietStore();

// Edit mode
const isEditMode = computed(() => route.query.mode === "edit" && route.query.dietId);
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
  amount: number; // 그램 단위 (50, 100, 150, 200)
  unit: "g";
  calories: number; // 계산된 칼로리 (amount에 비례)
  carbs: number; // 계산된 탄수화물 (amount에 비례)
  protein: number; // 계산된 단백질 (amount에 비례)
  fat: number; // 계산된 지방 (amount에 비례)
  baseCalories: number; // 100g 기준 기본 칼로리
  baseCarbs: number; // 100g 기준 기본 탄수화물
  baseProtein: number; // 100g 기준 기본 단백질
  baseFat: number; // 100g 기준 기본 지방
}

// State
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const selectedTime = ref(new Date().toTimeString().slice(0, 5));

const getMealTypeFromTime = (time: string) => {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
};

const selectedMealType = ref(getMealTypeFromTime(selectedTime.value));

// 사용자가 시간을 변경하면 끼니 종류도 자동으로 추천 (수정 모드가 아닐 때만)
watch(selectedTime, (newTime) => {
  if (!isEditMode.value) {
    selectedMealType.value = getMealTypeFromTime(newTime);
  }
});
const hasPhoto = ref(false);
const uploadedPhotoUrl = ref("");
const foods = ref<FoodItem[]>([]);

// Foods Catalog (GET /api/foods)
const catalogKeyword = ref("");
const selectedCatalogFoodId = ref<string>("");
const saveErrorMessage = ref("");
const showAutocomplete = ref(false);
const searchTimeout = ref<number | null>(null);
const autocompleteContainerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Options
const mealTypeOptions = [
  { label: "아침", value: "breakfast" },
  { label: "점심", value: "lunch" },
  { label: "저녁", value: "dinner" },
  { label: "간식", value: "snack" },
];

const servingOptions = [
  // 인분 단위로 표시 (내부 값은 그램 단위로 저장하여 백엔드 호환성 유지)
  // 1인분 = 100g 기준
  { label: "0.5인분", value: "50" },
  { label: "1인분", value: "100" },
  { label: "1.5인분", value: "150" },
  { label: "2인분", value: "200" },
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

// Actions
const fetchCatalogFoods = async () => {
  try {
    const keyword = catalogKeyword.value.trim() || undefined;
    await foodsStore.fetchFoods({ keyword });
  } catch (error) {
    console.error("Failed to fetch foods:", error);
  }
};

// 실시간 검색 (debounce)
// 실시간 검색 (debounce)
watch(catalogKeyword, (newValue) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (newValue.trim().length > 0) {
    // 검색어가 있으면 드롭다운 표시 (검색어 입력 시에는 사라지지 않음)
    showAutocomplete.value = true;
    searchTimeout.value = window.setTimeout(() => {
      fetchCatalogFoods();
    }, 300); // 300ms debounce
  } else {
    showAutocomplete.value = false;
  }
});

// 검색 결과 필터링 (API에서 이미 검색어로 필터링된 결과를 사용)
const filteredFoodOptions = computed(() => {
  if (!catalogKeyword.value.trim()) {
    return [];
  }
  // API에서 이미 검색어로 필터링된 결과를 반환하므로, 추가 필터링 없이 그대로 사용
  return foodsStore.foods.map((f) => ({
    label: `${f.name} · ${formatDecimal(f.calories)}kcal`,
    value: String(f.id),
    food: f,
  }));
});

// Input 포커스/입력 핸들러
const handleInputFocus = () => {
  if (catalogKeyword.value.trim().length > 0) {
    showAutocomplete.value = true;
  }
};

const handleInputChange = () => {
  // 검색어 입력 시 드롭다운 유지 (변경 없음)
};

// 자동완성에서 음식 선택
const handleSelectFood = async (foodId: string) => {
  selectedCatalogFoodId.value = foodId;
  catalogKeyword.value = "";
  showAutocomplete.value = false;
  await handleAddCatalogFood();
  selectedCatalogFoodId.value = "";
};

// 외부 클릭 시 자동완성 닫기
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  // Input이나 드롭다운 내부 클릭은 무시 (검색어 입력 중에는 드롭다운 유지)
  if (autocompleteContainerRef.value && autocompleteContainerRef.value.contains(target)) {
    return;
  }

  // Input에 포커스가 있고 검색어가 있으면 드롭다운 유지
  if (inputRef.value && document.activeElement === inputRef.value && catalogKeyword.value.trim().length > 0) {
    return;
  }

  // 실제 외부 클릭 시에만 닫기
  showAutocomplete.value = false;
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
      const hours = String(dateTime.getHours()).padStart(2, "0");
      const minutes = String(dateTime.getMinutes()).padStart(2, "0");
      selectedTime.value = `${hours}:${minutes}`;
    } else {
      // createdAt이 없으면 timeSlot에 따라 기본 시간 설정
      switch (diet.timeSlot) {
        case "BREAKFAST":
          selectedTime.value = "08:00";
          break;
        case "LUNCH":
          selectedTime.value = "12:30";
          break;
        case "DINNER":
          selectedTime.value = "19:00";
          break;
        case "SNACK":
          selectedTime.value = "15:00";
          break;
      }
    }

    // 식사 타입 설정
    switch (diet.timeSlot) {
      case "BREAKFAST":
        selectedMealType.value = "breakfast";
        break;
      case "LUNCH":
        selectedMealType.value = "lunch";
        break;
      case "DINNER":
        selectedMealType.value = "dinner";
        break;
      case "SNACK":
        selectedMealType.value = "snack";
        break;
    }

    // 음식 목록 설정
    if (diet.items && Array.isArray(diet.items)) {
      foods.value = await Promise.all(
        diet.items.map(async (item, idx: number) => {
          const amount = item.amount || 100;
          let baseCalories = 0;
          let baseCarbs = 0;
          let baseProtein = 0;
          let baseFat = 0;

          // 음식 이름 초기화 (fallback 처리)
          // 백엔드 응답에 따라 item.name 또는 item.foodName에 값이 있을 수 있음
          let foodName = item.name || (item as any).foodName || "";

          // foodId가 있으면 상세 정보 조회하여 기본값 설정
          if (item.foodId) {
            try {
              const foodDetail = await foodsStore.fetchFoodDetail(item.foodId);
              baseCalories = foodDetail.calories;
              baseCarbs = foodDetail.carbohydrate;
              baseProtein = foodDetail.protein;
              baseFat = foodDetail.fat;

              // 최신 음식 이름으로 업데이트 (DB 기준)
              foodName = foodDetail.name;
            } catch (e) {
              // 조회 실패 시 저장된 calories를 100g 기준으로 가정
              baseCalories = item.calories || 0;
              baseCarbs = 0;
              baseProtein = 0;
              baseFat = 0;
            }
          } else {
            // foodId가 없으면 저장된 calories를 100g 기준으로 가정
            baseCalories = item.calories || 0;
            baseCarbs = 0;
            baseProtein = 0;
            baseFat = 0;
          }

          // amount에 비례하여 계산
          const calculatedCalories = calculateNutrition(baseCalories, amount);
          const calculatedCarbs = calculateNutrition(baseCarbs, amount);
          const calculatedProtein = calculateNutrition(baseProtein, amount);
          const calculatedFat = calculateNutrition(baseFat, amount);

          return {
            id: `edit-${item.dietItemId || idx}`,
            foodId: item.foodId || null,
            name: foodName,
            checked: true,
            amount: amount,
            unit: "g" as const,
            calories: calculatedCalories,
            carbs: calculatedCarbs,
            protein: calculatedProtein,
            fat: calculatedFat,
            baseCalories: baseCalories,
            baseCarbs: baseCarbs,
            baseProtein: baseProtein,
            baseFat: baseFat,
          };
        })
      );
    }
  } catch (e: any) {
    console.error("Failed to load diet for edit", e);
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

  // 외부 클릭 감지 (bubble phase 사용)
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  // 이벤트 리스너 정리
  document.removeEventListener("click", handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});

// State
const isAnalyzing = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedImageFile = ref<File | null>(null);

// ... existing code ...

const handlePhotoUpload = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    return;
  }

  // Save for upload later
  selectedImageFile.value = file;

  // Local preview
  if (uploadedPhotoUrl.value) {
    URL.revokeObjectURL(uploadedPhotoUrl.value);
  }
  uploadedPhotoUrl.value = URL.createObjectURL(file);
  hasPhoto.value = true;

  // Analyze
  isAnalyzing.value = true;
  foods.value = []; // Reset existing

  try {
    const response = await detectionApi.detectImage(file);

    if (response.results && response.results.length > 0) {
      const newFoods: FoodItem[] = [];

      // Process each detected food
      for (const result of response.results) {
        const label = result.label;
        let foodData = {
          name: label,
          calories: 100, // Default fallback
          carbs: 20,
          protein: 5,
          fat: 1,
          foodId: null as number | null,
        };

        try {
          // Search API for real nutrition data
          const searchResults = await foodsStore.fetchFoods({ keyword: label });

          // If we have results, use the first one (assuming best match)
          if (searchResults && searchResults.length > 0) {
            const matched = searchResults[0];
            foodData = {
              name: matched.name,
              calories: matched.calories,
              carbs: matched.carbohydrate,
              protein: matched.protein,
              fat: matched.fat,
              foodId: matched.id,
            };
          }
        } catch (e) {
          console.warn(`Failed to fetch nutrition for ${label}, using defaults.`);
        }

        newFoods.push({
          id: `k-${Date.now()}-${result.class_id}-${Math.random()}`, // Ensure unique ID
          foodId: foodData.foodId,
          name: foodData.name,
          checked: true,
          amount: 100, // Default 1 serving
          unit: "g",
          baseCalories: foodData.calories,
          baseCarbs: foodData.carbs,
          baseProtein: foodData.protein,
          baseFat: foodData.fat,
          calories: foodData.calories,
          carbs: foodData.carbs,
          protein: foodData.protein,
          fat: foodData.fat,
        });
      }

      foods.value = newFoods;
    } else {
      alert("음식을 찾을 수 없어요. 직접 검색해서 추가해주세요.");
    }
  } catch (error) {
    console.error("Detection failed:", error);
    alert("사진 분석에 실패했습니다. 다시 시도하거나 직접 입력해주세요.");
    hasPhoto.value = false;
    uploadedPhotoUrl.value = "";
  } finally {
    isAnalyzing.value = false;
    // Reset input so same file can be selected again
    input.value = "";
  }
};

const handlePhotoDelete = () => {
  hasPhoto.value = false;
  if (uploadedPhotoUrl.value) {
    URL.revokeObjectURL(uploadedPhotoUrl.value);
    uploadedPhotoUrl.value = "";
  }
  foods.value = [];
};

// 영양 정보 계산 함수 (100g 기준값을 amount에 비례하여 계산)
const calculateNutrition = (baseValue: number, amount: number): number => {
  // baseValue는 100g 기준, amount는 실제 그램 수
  return Math.round(((baseValue * amount) / 100) * 10) / 10; // 소수점 첫째자리까지
};

// amount 변경 시 영양 정보 자동 계산
const updateFoodNutrition = (food: FoodItem) => {
  // 수동 입력 제거로 인해 항상 자동 계산
  food.calories = calculateNutrition(food.baseCalories, food.amount);
  food.carbs = calculateNutrition(food.baseCarbs, food.amount);
  food.protein = calculateNutrition(food.baseProtein, food.amount);
  food.fat = calculateNutrition(food.baseFat, food.amount);
};

const handleToggleFood = (id: string) => {
  const food = foods.value.find((f) => f.id === id);
  if (food) food.checked = !food.checked;
};

const handleDeleteFood = (id: string) => {
  foods.value = foods.value.filter((f) => f.id !== id);
};

// ... existing code ...

const handleAddCatalogFood = async () => {
  if (!selectedCatalogFoodId.value) return;
  const foodId = Number(selectedCatalogFoodId.value);
  if (!Number.isFinite(foodId)) return;

  // 상세 조회로 영양정보 확정 (캐시 있으면 즉시 반환)
  const selected = await foodsStore.fetchFoodDetail(foodId);

  // 100g 기준 기본 영양 정보 저장
  const baseCalories = selected.calories;
  const baseCarbs = selected.carbohydrate;
  const baseProtein = selected.protein;
  const baseFat = selected.fat;

  // 초기값은 100g(1인분) 기준
  const initialAmount = 100;

  foods.value.push({
    id: `catalog-${selected.id}-${Date.now()}`,
    foodId: selected.id,
    name: selected.name,
    checked: true,
    amount: initialAmount,
    unit: "g",
    calories: baseCalories, // 100g 기준이므로 그대로
    carbs: baseCarbs,
    protein: baseProtein,
    fat: baseFat,
    baseCalories: baseCalories,
    baseCarbs: baseCarbs,
    baseProtein: baseProtein,
    baseFat: baseFat,
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

const handleSave = async () => {
  saveErrorMessage.value = "";

  const selectedItems = foods.value.filter((f) => f.checked);
  if (selectedItems.length === 0) {
    saveErrorMessage.value = "저장할 음식이 없습니다. 최소 1개 이상 선택해주세요.";
    return;
  }

  // foodId는 필수입니다. 음식 DB에서 이름으로 매칭해 foodId를 채웁니다.
  for (const item of selectedItems) {
    if (!item.name?.trim()) {
      saveErrorMessage.value = "음식 이름이 비어있는 항목이 있어요. 이름을 입력해주세요.";
      return;
    }
    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      saveErrorMessage.value = "수량(amount)은 0보다 커야 합니다.";
      return;
    }

    // foodId가 없으면 음식 DB에서 이름으로 매칭 시도
    if (item.foodId == null) {
      const normalized = item.name.trim().toLowerCase();
      const matched = foodsStore.foods.find((f) => f.name.trim().toLowerCase() === normalized);
      if (matched) {
        item.foodId = matched.id;
      }
    }
  }

  // foodId가 없는 항목이 있으면 저장 불가
  const missingFoodId = selectedItems.filter((f) => f.foodId == null);
  if (missingFoodId.length > 0) {
    saveErrorMessage.value = "음식 DB에 등록된 음식만 저장할 수 있어요. 음식 검색에서 선택한 음식만 추가해주세요.";
    return;
  }

  try {
    let imageKey = "";

    // 1. Upload new image if selected
    if (selectedImageFile.value) {
      try {
        const key = await imageApi.uploadImage(selectedImageFile.value, "DIET");
        imageKey = key;
      } catch (e) {
        console.error("Image upload failed", e);
        saveErrorMessage.value = "사진 업로드에 실패했습니다. 사진 없이 저장하거나 다시 시도해주세요.";
        return;
      }
    }

    if (isEditMode.value && editDietId.value) {
      // 수정 모드
      const updatePayload: UpdateMyDietItemRequest[] = selectedItems.map((f, index) => ({
        foodId: f.foodId!,
        serveCount: f.amount / 100, // 인분 단위로 변환 (100g = 1인분)
        orderIndex: index + 1,
      }));

      // date와 selectedTime을 합쳐서 ISO datetime 형식으로 생성
      const dateWithTime = `${selectedDate.value}T${selectedTime.value}:00`;

      const updatePayloadData: UpdateMyDietRequest = {
        recordedAt: dateWithTime,
        mealType: toTimeSlot(selectedMealType.value) as DietTimeSlot,
        items: updatePayload,
        imageUrl: imageKey || undefined,
      };

      await dietStore.updateMyDiet(editDietId.value, updatePayloadData);
    } else {
      // 생성 모드
      const dateWithTime = `${selectedDate.value}T${selectedTime.value}:00`;

      const payload: CreateMyDietRequest = {
        recordedAt: dateWithTime,
        mealType: toTimeSlot(selectedMealType.value) as DietTimeSlot,
        items: selectedItems.map((f, index) => ({
          foodId: f.foodId!,
          serveCount: f.amount / 100,
          orderIndex: index + 1,
        })),
        imageUrl: imageKey || undefined,
      };

      await dietStore.createMyDiet(payload);
    }

    // AI 주간 영양 평가 생성 트리거 (비동기, 결과 기다리지 않음)
    localStorage.setItem("LAST_MEAL_UPDATE_TIME", new Date().toISOString());
    statsApi.generateNutritionReview({ anchorDate: selectedDate.value }).catch((e) => console.warn(e));

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
        <div class="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 w-[150px]">
          <span class="text-white text-sm flex-1">{{ selectedDate }}</span>
          <button @click="openDatePicker" class="text-white hover:text-emerald-400 transition-colors">
            <Calendar class="w-4 h-4" />
          </button>
          <input
            ref="dateInputRef"
            type="date"
            v-model="selectedDate"
            class="absolute inset-0 opacity-0 pointer-events-none"
          />
        </div>

        <!-- 시간 선택 -->
        <div class="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 w-[120px]">
          <span class="text-white text-sm flex-1">{{ selectedTime }}</span>
          <button @click="openTimePicker" class="text-white hover:text-emerald-400 transition-colors">
            <Clock class="w-4 h-4" />
          </button>
          <input
            ref="timeInputRef"
            type="time"
            v-model="selectedTime"
            class="absolute inset-0 opacity-0 pointer-events-none"
          />
        </div>

        <!-- 끼니 선택 -->
        <ToggleGroup v-model="selectedMealType" :options="mealTypeOptions" class="h-10" />
      </div>
    </div>

    <!-- 좌우 2열 레이아웃 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 좌측 - 식단 사진 업로드 & 미리보기 -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <!-- Hidden File Input (Always present) -->
          <input type="file" ref="fileInputRef" class="hidden" accept="image/*" @change="handleFileChange" />
          <div
            v-if="!hasPhoto"
            class="flex flex-col items-center justify-center py-16 space-y-4 border-2 border-dashed border-zinc-700 rounded-lg aspect-square"
          >
            <div class="text-6xl">🍽</div>
            <p class="text-zinc-400 text-center">
              식단 사진을 업로드하면,<br />
              AI가 음식과 영양 정보를 분석해줘요.
            </p>
            <Button
              @click="handlePhotoUpload"
              class="bg-emerald-500 hover:bg-emerald-600 text-white"
              :disabled="isAnalyzing"
            >
              <div class="flex items-center">
                <div
                  v-if="isAnalyzing"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                ></div>
                <Upload v-else class="w-4 h-4 mr-2" />
                <span>{{ isAnalyzing ? "분석 중..." : "사진 업로드" }}</span>
              </div>
            </Button>
          </div>
          <div v-else>
            <div class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <ImageWithFallback
                :src="uploadedPhotoUrl"
                alt="업로드된 식단 사진"
                class="w-full h-full object-contain bg-zinc-950"
              />

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
          <div ref="autocompleteContainerRef" class="space-y-3 autocomplete-container">
            <div class="relative">
              <Input
                ref="inputRef"
                v-model="catalogKeyword"
                placeholder="음식 검색 (예: 닭가슴살)"
                class="h-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                @focus="handleInputFocus"
                @input="handleInputChange"
                @click.stop
              />

              <!-- 자동완성 드롭다운 -->
              <div
                v-if="showAutocomplete && catalogKeyword.trim().length > 0 && filteredFoodOptions.length > 0"
                class="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                @click.stop
              >
                <div
                  v-for="option in filteredFoodOptions"
                  :key="option.value"
                  @click.stop="handleSelectFood(option.value)"
                  class="px-4 py-3 hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-800 last:border-b-0"
                >
                  <div class="text-white text-sm font-medium">{{ option.food.name }}</div>
                  <div class="text-zinc-400 text-xs mt-1">
                    {{ formatDecimal(option.food.calories) }}kcal · 탄수화물
                    {{ formatDecimal(option.food.carbohydrate) }}g · 단백질 {{ formatDecimal(option.food.protein) }}g ·
                    지방 {{ formatDecimal(option.food.fat) }}g
                  </div>
                </div>
              </div>

              <!-- 검색 결과 없음 -->
              <div
                v-if="
                  showAutocomplete &&
                  catalogKeyword.trim().length > 0 &&
                  !foodsStore.isLoading &&
                  filteredFoodOptions.length === 0
                "
                class="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-4"
                @click.stop
              >
                <div class="text-zinc-400 text-sm text-center">검색 결과가 없습니다.</div>
              </div>
            </div>

            <div v-if="foodsStore.errorMessage" class="text-sm text-red-400">
              {{ foodsStore.errorMessage }}
            </div>

            <div v-if="foodsStore.isLoading && catalogKeyword.trim().length > 0" class="text-xs text-zinc-500">
              음식 목록 불러오는 중...
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

                  <label :for="`food-${food.id}`" class="text-white cursor-pointer flex-1">
                    {{ food.name }}
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <!-- 수량 드롭다운 -->
                  <Select
                    :model-value="food.amount.toString()"
                    @update:model-value="
                      (val) => {
                        food.amount = Number(val);
                        updateFoodNutrition(food);
                      }
                    "
                    :options="servingOptions"
                    class="w-[100px] h-9 text-xs bg-zinc-900 border-zinc-700 text-white"
                  />

                  <button @click="handleDeleteFood(food.id)" class="text-zinc-500 hover:text-red-400 transition-colors">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- 영양 정보 요약 -->
              <div class="text-sm text-zinc-400">
                {{ formatDecimal(food.calories) }} kcal · 탄수화물 {{ formatDecimal(food.carbs) }}g · 단백질
                {{ formatDecimal(food.protein) }}g · 지방 {{ formatDecimal(food.fat) }}g
              </div>
            </div>
          </div>
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
            <p class="text-2xl text-emerald-400">
              총 섭취 예상 칼로리: {{ formatDecimal(totalNutrition.calories) }} kcal
            </p>
            <p class="text-zinc-300">
              탄수화물: {{ formatDecimal(totalNutrition.carbs) }}g / 단백질:
              {{ formatDecimal(totalNutrition.protein) }}g / 지방: {{ formatDecimal(totalNutrition.fat) }}g
            </p>
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
              {{ isEditMode ? "수정 중..." : "저장 중..." }}
            </span>
            <span v-else>{{ isEditMode ? "수정하기" : "이 식단으로 기록하기" }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
