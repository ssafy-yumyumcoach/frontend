<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Upload, Trash2, X } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import Select from "@/components/ui/Select.vue";
import ToggleGroup from "@/components/ui/ToggleGroup.vue";
import ImageWithFallback from "@/components/common/ImageWithFallback.vue";

const router = useRouter();

// Types
interface FoodItem {
  id: string;
  name: string;
  checked: boolean;
  serving: string;
  servingAmount: number;
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

// Options
const mealTypeOptions = [
  { label: "아침", value: "breakfast" },
  { label: "점심", value: "lunch" },
  { label: "저녁", value: "dinner" },
  { label: "간식", value: "snack" },
];

const servingOptions = [
  { label: "0.5 인분", value: "0.5" },
  { label: "1.0 인분", value: "1" },
  { label: "1.5 인분", value: "1.5" },
  { label: "2.0 인분", value: "2" },
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
const handlePhotoUpload = () => {
  hasPhoto.value = true;
  uploadedPhotoUrl.value = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
  foods.value = [
    {
      id: "1",
      name: "밥",
      checked: true,
      serving: "1인분",
      servingAmount: 1,
      calories: 250,
      carbs: 45,
      protein: 4,
      fat: 1,
      manualInput: false,
    },
    {
      id: "2",
      name: "치킨 샐러드",
      checked: true,
      serving: "1인분",
      servingAmount: 1,
      calories: 320,
      carbs: 25,
      protein: 20,
      fat: 15,
      manualInput: false,
    },
    {
      id: "3",
      name: "고구마",
      checked: true,
      serving: "1개",
      servingAmount: 1,
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
    name: "새 음식",
    checked: true,
    serving: "1인분",
    servingAmount: 1,
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    manualInput: true,
  });
};

const handleSave = () => {
  console.log("Saving meal:", {
    date: selectedDate.value,
    time: selectedTime.value,
    type: selectedMealType.value,
    foods: foods.value,
  });
  router.push("/dashboard");
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
              <h3 className="text-lg text-white">이번 식단에 들어간 음식</h3>
              <span className="text-xs text-zinc-500"> 체크된 음식만 기록에 저장돼요. </span>
            </div>
            <p className="text-sm text-zinc-400">
              AI가 사진에서 인식한 음식에, 직접 추가/수정한 음식도 함께 기록할 수 있어요.
            </p>
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
                    :model-value="food.servingAmount.toString()"
                    @update:model-value="(val) => (food.servingAmount = Number(val))"
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
        </div>

        <!-- 저장 버튼 -->
        <div class="flex gap-3">
          <Button
            @click="router.push('/dashboard')"
            variant="outline"
            class="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            취소
          </Button>
          <Button @click="handleSave" class="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
            이 식단으로 기록하기
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
