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
  const foodDetails = ref<Record<number, Food>>({});
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
    foodDetails.value = {};
    lastFetchedAt.value = null;
    lastParams.value = null;
  };

  const fetchFoods = async (params?: FoodListParams) => {
    isLoading.value = true;
    errorMessage.value = "";
    lastParams.value = params ?? null;

    try {
      const response = await dietApi.getFoods(params);
      
      // 응답 구조에 따라 유연하게 처리
      let foodsArray: Food[] = [];
      const data = response.data as any;
      
      if (Array.isArray(data)) {
        foodsArray = data;
      } else if (data?.foods && Array.isArray(data.foods)) {
        foodsArray = data.foods;
      } else if (data && typeof data === 'object') {
        if (data.id && data.name) {
          foodsArray = [data];
        } else {
          foodsArray = [];
        }
      } else {
        foodsArray = [];
      }
      
      foods.value = foodsArray;
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

  const fetchFoodDetail = async (foodId: number) => {
    errorMessage.value = "";
    // 캐시가 있으면 즉시 반환
    if (foodDetails.value[foodId]) return foodDetails.value[foodId];

    isLoading.value = true;
    try {
      const response = await dietApi.getFoodDetail(foodId);
      const detail = response.data;

      foodDetails.value = { ...foodDetails.value, [foodId]: detail };
      // 목록에도 있으면 최신 정보로 동기화
      const idx = foods.value.findIndex((f) => f.id === foodId);
      if (idx >= 0) {
        const next = foods.value.slice();
        next[idx] = detail;
        foods.value = next;
      }

      return detail;
    } catch (error: unknown) {
      let message = "음식 상세 정보를 불러오는데 실패했습니다.";
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
    foodDetails,
    isLoading,
    errorMessage,
    lastFetchedAt,
    lastParams,

    // getters
    hasFoods,
    foodById,

    // actions
    fetchFoods,
    fetchFoodDetail,
    clearFoods,
    clearError,
  };
});


