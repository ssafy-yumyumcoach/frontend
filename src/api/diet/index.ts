import api from "@/api/axios";

export interface Food {
  id: number;
  name: string;
  calories: number;
  carbohydrate: number;
  protein: number;
  fat: number;
}

export interface FoodListResponse {
  foods: Food[];
}

export interface FoodListParams {
  keyword?: string;
  page?: number;
}

export default {
  // Diet
  getDailyDiet: (date: string) => api.get(`/diets?date=${date}`),
  logMeal: (data: any) => api.post(`/diets`, data),

  // Foods
  /**
   * 전체 음식 목록 조회
   * GET /api/foods
   *
   * Authorization: Bearer {accessToken} (axios interceptor에서 자동 첨부)
   */
  getFoods: (params?: FoodListParams) => api.get<FoodListResponse>(`/foods`, { params }),
};
