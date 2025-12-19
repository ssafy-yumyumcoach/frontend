<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Search, Plus, X } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";

const router = useRouter();

// Types
interface Exercise {
  id: string;
  name: string;
  category: string;
  met: number;
  icon: string;
}

interface SelectedExercise {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  duration: number; // 분
  intensity: string; // 낮음, 보통, 높음
  calories: number;
}

// State
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const selectedTime = ref("18:00");
const searchQuery = ref("");
const selectedCategory = ref("전체");
const selectedExercises = ref<SelectedExercise[]>([
  {
    id: "1",
    exerciseId: "squat",
    name: "스쿼트",
    category: "하체 · 근력",
    duration: 30,
    intensity: "보통",
    calories: 180,
  },
  {
    id: "2",
    exerciseId: "plank",
    name: "플랭크",
    category: "코어",
    duration: 15,
    intensity: "보통",
    calories: 140,
  },
]);

// Data
const categories = ["전체", "유산소", "근력", "코어", "스트레칭"];

const exercises: Exercise[] = [
  { id: "squat", name: "스쿼트", category: "근력", met: 5.0, icon: "🏋️" },
  { id: "pushup", name: "푸시업", category: "근력", met: 3.8, icon: "💪" },
  { id: "plank", name: "플랭크", category: "코어", met: 4.0, icon: "🧘" },
  { id: "running", name: "러닝", category: "유산소", met: 7.0, icon: "🏃" },
  { id: "walking", name: "걷기", category: "유산소", met: 3.5, icon: "🚶" },
  { id: "yoga", name: "요가", category: "스트레칭", met: 2.5, icon: "🧘‍♀️" },
  { id: "cycling", name: "사이클링", category: "유산소", met: 6.0, icon: "🚴" },
  { id: "deadlift", name: "데드리프트", category: "근력", met: 6.0, icon: "🏋️‍♂️" },
];

const intensityOptions = [
  { label: "낮음", value: "낮음" },
  { label: "보통", value: "보통" },
  { label: "높음", value: "높음" },
];

// Computed
const filteredExercises = computed(() => {
  return exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value === "전체" || exercise.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

const totalDuration = computed(() => {
  return selectedExercises.value.reduce((sum, ex) => sum + ex.duration, 0);
});

const totalCalories = computed(() => {
  return selectedExercises.value.reduce((sum, ex) => sum + ex.calories, 0);
});

// Actions
const handleAddExercise = (exercise: Exercise) => {
  const newExercise: SelectedExercise = {
    id: Date.now().toString(),
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    duration: 30,
    intensity: "보통",
    calories: 150, // 임시 계산
  };
  selectedExercises.value.push(newExercise);
};

const handleRemoveExercise = (id: string) => {
  selectedExercises.value = selectedExercises.value.filter((ex) => ex.id !== id);
};

const handleUpdateExercise = (id: string, field: keyof SelectedExercise, value: number | string) => {
  const exercise = selectedExercises.value.find((ex) => ex.id === id);
  if (exercise) {
    if (field === "duration") exercise.duration = Number(value);
    if (field === "intensity") exercise.intensity = String(value);
    // Recalculate calories based on duration/intensity/MET (simplified logic)
    exercise.calories = Math.floor(
      exercise.duration * 5 * (exercise.intensity === "높음" ? 1.2 : exercise.intensity === "낮음" ? 0.8 : 1.0)
    );
  }
};

const handleSave = () => {
  console.log("Saving exercise:", {
    date: selectedDate.value,
    time: selectedTime.value,
    exercises: selectedExercises.value,
  });
  router.push("/dashboard");
};
</script>

<template>
  <div class="space-y-6">
    <!-- 상단 - 타이틀 + 메타 정보 -->
    <!-- 상단 - 메타 정보 -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-end gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <!-- 날짜 선택 -->
        <div class="relative">
          <Input type="date" v-model="selectedDate" class="w-[150px] bg-zinc-900 border-zinc-800 text-white text-sm" />
        </div>

        <!-- 시간 선택 -->
        <Input type="time" v-model="selectedTime" class="w-[110px] bg-zinc-900 border-zinc-800 text-white text-sm" />
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
          <div class="space-y-3 max-h-[500px] overflow-y-auto">
            <div v-if="filteredExercises.length > 0" class="space-y-3">
              <div
                v-for="exercise in filteredExercises"
                :key="exercise.id"
                class="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="text-2xl">{{ exercise.icon }}</span>
                    <div>
                      <div class="text-white">
                        {{ exercise.name }} <span class="text-zinc-400 text-sm">({{ exercise.category }})</span>
                      </div>
                      <div class="text-sm text-zinc-400">기본 MET: {{ exercise.met }}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    @click="handleAddExercise(exercise)"
                    class="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    추가하기
                  </Button>
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
            <div class="text-5xl">💪</div>
            <p class="text-zinc-400">오늘 등록할 운동이 아직 없어요.</p>
            <p class="text-zinc-500 text-sm">
              왼쪽에서 운동을 검색하거나<br />
              카테고리에서 골라 추가해보세요.
            </p>
          </div>
          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto">
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
                <!-- 시간(분) - 직접 입력 -->
                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">시간(분)</label>
                  <Input
                    type="number"
                    v-model="exercise.duration"
                    @input="(e: Event) => handleUpdateExercise(exercise.id, 'duration', (e.target as HTMLInputElement).value)"
                    class="h-9 bg-zinc-900 border-zinc-700 text-white"
                    min="0"
                  />
                </div>

                <!-- 강도 -->
                <div class="space-y-1">
                  <label class="text-xs text-zinc-400">강도</label>
                  <Select
                    :model-value="exercise.intensity"
                    @update:model-value="(val) => handleUpdateExercise(exercise.id, 'intensity', val)"
                    :options="intensityOptions"
                    class="h-9 text-xs bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <!-- 예상 소모 칼로리 -->
              <div class="pt-2 border-t border-zinc-700">
                <div class="text-sm text-emerald-400">예상 소모 칼로리: {{ exercise.calories }} kcal</div>
                <div class="text-xs text-zinc-500 mt-0.5">※ 소모 칼로리는 평균값으로 실제와 다를 수 있어요.</div>
              </div>
            </div>

            <!-- 운동 더 추가하기 (기능 없음, UI만) -->
            <button
              class="w-full py-4 border-2 border-dashed border-zinc-700 rounded-lg text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus class="w-5 h-5" />
              <span>운동 더 추가하기</span>
            </button>
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
            이대로 운동 기록 저장하기
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
