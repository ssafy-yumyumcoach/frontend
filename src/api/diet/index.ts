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

export type DietTimeSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

/**
 * NOTE: 현재 백엔드 CreateDietRecordRequest 검증 기준에 맞춘 요청 타입
 * - recordedAt: NotNull (LocalDateTime)
 * - mealType: NotBlank
 * - items[].serveCount: NotNull (Double)
 * - items[].orderIndex: NotNull (Integer)
 */
export interface CreateMyDietItemRequest {
  foodId: number | null;
  name: string;
  serveCount: number;
  orderIndex: number;
}

export interface CreateMyDietRequest {
  recordedAt: string; // ISO string (e.g. 2025-12-05T08:30:00)
  mealType: DietTimeSlot;
  items: CreateMyDietItemRequest[];
  memo?: string;
}

// 백엔드 응답은 ResponseEntity<Long> 형태로 보임(식단 기록 ID)
export type CreateMyDietResponse = number;

export default {
  // Diet
  getDailyDiet: (date: string) => api.get(`/diets?date=${date}`),
  logMeal: (data: any) => api.post(`/diets`, data),

  /**
   * 내 식단 한 건 추가
   * POST /api/me/diets
   */
  createMyDiet: (data: CreateMyDietRequest) => api.post<CreateMyDietResponse>(`/me/diets`, data),

  // Foods
  /**
   * 전체 음식 목록 조회
   * GET /api/foods
   *
   * Authorization: Bearer {accessToken} (axios interceptor에서 자동 첨부)
   */
  getFoods: (params?: FoodListParams) => api.get<FoodListResponse>(`/foods`, { params }),

  /**
   * 음식 상세 조회
   * GET /api/foods/{foodId}
   *
   * Authorization: Bearer {accessToken} (axios interceptor에서 자동 첨부)
   */
  getFoodDetail: (foodId: number) => api.get<Food>(`/foods/${foodId}`),
};
