<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Search, Plus, X, Calendar, Clock } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";

import { useExerciseStore } from "@/stores/exercise";
import type { Exercise } from "@/api/exercise";

const router = useRouter();
const route = useRoute();
const dateInputRef = ref<HTMLInputElement | null>(null);
const timeInputRef = ref<HTMLInputElement | null>(null);

const exerciseStore = useExerciseStore();
const { selectedExercises, isLoading, groupedExercises, totalDuration, totalCalories } = storeToRefs(exerciseStore);

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

// State
const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const selectedDate = ref((route.query.date as string) || getLocalDateString());
const selectedTime = ref(new Date().toTimeString().slice(0, 5));
const searchQuery = ref("");
const selectedCategory = ref("전체");

// Edit Mode State
const isEditMode = ref(false);

// Data
const categories = ["전체", "맨몸 운동", "웨이트", "유산소", "스트레칭", "스포츠"];

// Lifecycle
onMounted(async () => {
  await exerciseStore.fetchExercises();
  checkEditMode();
});

onUnmounted(() => {
  exerciseStore.clearSelection();
});

const checkEditMode = async () => {
  const mode = route.query.mode as string;
  const idsStr = route.query.ids as string;

  if (mode === "edit" && idsStr) {
    isEditMode.value = true;
    const ids = idsStr.split(",").map(Number);
    try {
      const recordedAt = await exerciseStore.loadEditData(ids);
      if (recordedAt) {
        const parts = recordedAt.split("T");
        selectedDate.value = parts[0];
        selectedTime.value = parts[1].substring(0, 5); // HH:MM
      }
    } catch (e) {
      alert("운동 기록을 불러오는데 실패했습니다.");
    }
  }
};

// Computed
const uniqueExercises = computed(() => {
  return Object.values(groupedExercises.value).map((group) => group[0]);
});

const filteredExercises = computed(() => {
  return uniqueExercises.value.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value === "전체" || exercise.type === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

// Actions
const handleAddExercise = (exercise: Exercise) => {
  exerciseStore.addExerciseToSelection(exercise);
};

const handleRemoveExercise = (id: string) => {
  exerciseStore.removeExerciseFromSelection(id);
};

const handleUpdateExercise = (id: string, field: "duration" | "intensity", value: number | string) => {
  exerciseStore.updateExerciseInSelection(id, field, value);
};

const getIntensityOptions = (name: string) => {
  const variants = groupedExercises.value[name] || [];
  const levels = Array.from(new Set(variants.map((v) => v.intensityLevel)));

  const order = ["낮음", "중간", "높음"];
  levels.sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return 0;
  });

  return levels.map((l) => ({ label: l, value: l }));
};

const handleSave = async () => {
  try {
    await exerciseStore.saveExerciseRecords(selectedDate.value, selectedTime.value);
    
    alert(isEditMode.value ? "운동 기록이 수정되었습니다." : "운동 기록이 저장되었습니다.");
    router.push("/dashboard");
  } catch (error: any) {
    if (error.message === "NO_SELECTION") {
      alert("운동을 최소 하나 이상 선택해주세요.");
    } else {
      console.error("Failed to save:", error);
      alert("운동 기록 저장에 실패했습니다.");
    }
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 상단 - 타이틀 + 메타 정보 -->
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
      </div>
    </div>

    <!-- 좌우 2열 레이아웃 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 좌측 - 운동 검색 & 목록 -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <!-- 검색바 -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="운동 이름을 검색하세요 (예: 스쿼트, 걷기)"
              v-model="searchQuery"
              class="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <!-- 카테고리 탭 -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              :class="[
                'px-4 py-2 rounded-lg transition-all text-sm',
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white',
              ]"
            >
              {{ category }}
            </button>
          </div>

          <!-- 운동 리스트 -->
          <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div v-if="isLoading" class="text-center py-10 text-zinc-500">로딩 중...</div>
            <div v-else-if="filteredExercises.length > 0" class="space-y-2">
              <div
                v-for="exercise in filteredExercises"
                :key="exercise.name"
                class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-zinc-500 transition-colors"
                @click="handleAddExercise(exercise)"
              >
                <div class="flex items-center justify-between gap-3 cursor-pointer">
                  <!-- Single Line Layout -->
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="text-white font-medium truncate">{{ exercise.name }}</span>
                    <span class="text-zinc-500 text-xs whitespace-nowrap px-2 py-0.5 bg-zinc-800 rounded">{{
                      exercise.type
                    }}</span>
                  </div>

                  <Plus class="w-4 h-4 text-zinc-500 hover:text-white" />
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 space-y-2">
              <p class="text-zinc-400">해당 이름의 운동을 찾을 수 없어요.</p>
              <p class="text-zinc-500 text-sm">비슷한 이름으로 다시 검색해보세요.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 - 선택된 운동 목록 & 입력 폼 -->
      <div class="space-y-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          <h3 class="text-lg text-white pb-2 border-b border-zinc-800">오늘 기록할 운동</h3>

          <div v-if="selectedExercises.length === 0" class="text-center py-16 space-y-3">
            <div class="text-4xl grayscale opacity-50">📝</div>
            <p class="text-zinc-400">오늘 등록할 운동이 아직 없어요.</p>
            <p class="text-zinc-500 text-sm">왼쪽에서 운동을 선택해서 추가해주세요.</p>
          </div>
          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div
              v-for="exercise in selectedExercises"
              :key="exercise.id"
              class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3"
            >
              <!-- 운동명 + 삭제 버튼 -->
              <div class="flex items-center justify-between">
                <div class="text-white">
                  {{ exercise.name }} <span class="text-zinc-400 text-sm">({{ exercise.category }})</span>
                </div>
                <button
                  @click="handleRemoveExercise(exercise.id)"
                  class="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- 시간과 강도 한 줄 배치 -->
              <div class="grid grid-cols-2 gap-3">
                <!-- 시간(분) -->
                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">시간(분)</label>
                  <Input
                    type="number"
                    v-model="exercise.duration"
                    @input="(e: Event) => handleUpdateExercise(exercise.id, 'duration', (e.target as HTMLInputElement).value)"
                    class="h-9 bg-zinc-900 border-zinc-700 text-white"
                    min="1"
                  />
                </div>

                <!-- 강도 -->
                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">강도</label>
                  <Select
                    :model-value="exercise.intensity"
                    @update:model-value="(val) => handleUpdateExercise(exercise.id, 'intensity', val)"
                    :options="getIntensityOptions(exercise.name)"
                    class="h-9 text-xs bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <!-- 예상 소모 칼로리 & MET -->
              <div
                class="pt-2 border-t border-zinc-700 flex justify-between items-center bg-zinc-800/50 px-3 py-2 rounded"
              >
                <div class="text-sm text-zinc-400">
                  MET <span class="text-white font-medium">{{ exercise.met }}</span>
                </div>
                <div class="text-sm text-emerald-400 font-bold">예상 {{ exercise.calories }} kcal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 - 운동 요약 & 저장 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- 요약 정보 -->
        <div class="space-y-3 flex-1">
          <h3 class="text-xl text-white">오늘 운동 요약</h3>
          <div class="space-y-2">
            <p class="text-2xl text-emerald-400">총 운동 시간: {{ totalDuration }}분</p>
            <p class="text-zinc-300">총 소모 칼로리: {{ totalCalories }} kcal</p>
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
            기록 저장하기
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
