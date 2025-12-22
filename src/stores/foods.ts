import { defineStore } from "pinia";
import { computed, ref } from "vue";
import dietApi, { type Food, type FoodListParams } from "@/api/diet";
import axios from "axios";

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
}

export const useFoodsStore = defineStore("foods", () => {
  const foods = ref<Food[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref<string>("");
  const lastFetchedAt = ref<number | null>(null);

  // 마지막으로 요청한 params를 보관 (재조회/UX용)
  const lastParams = ref<FoodListParams | null>(null);

  const hasFoods = computed(() => foods.value.length > 0);
  const foodById = computed(() => {
    const map = new Map<number, Food>();
    for (const f of foods.value) map.set(f.id, f);
    return (id: number) => map.get(id);
  });

  const clearError = () => {
    errorMessage.value = "";
  };

  const clearFoods = () => {
    foods.value = [];
    lastFetchedAt.value = null;
    lastParams.value = null;
  };

  const fetchFoods = async (params?: FoodListParams) => {
    isLoading.value = true;
    errorMessage.value = "";
    lastParams.value = params ?? null;

    try {
      const response = await dietApi.getFoods(params);
      foods.value = response.data.foods ?? [];
      lastFetchedAt.value = Date.now();
      return foods.value;
    } catch (error: unknown) {
      let message = "음식 목록을 불러오는데 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        if (data?.message) message = data.message;
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // state
    foods,
    isLoading,
    errorMessage,
    lastFetchedAt,
    lastParams,

    // getters
    hasFoods,
    foodById,

    // actions
    fetchFoods,
    clearFoods,
    clearError,
  };
});


