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
 * API 명세에 맞춘 요청 타입
 * POST /api/me/diets
 * - date: YYYY-MM-DD 형식
 * - timeSlot: BREAKFAST / LUNCH / DINNER / SNACK
 * - items[].foodId: number (필수)
 * - items[].name: string
 * - items[].amount: number
 * - items[].unit: "g"
 */
export interface CreateMyDietItemRequest {
  foodId: number; // Long (NotNull)
  serveCount: number; // Double (NotNull, Positive) - 인분 단위 (1 = 1인분, 1.5 = 1.5인분)
  orderIndex: number; // Integer (NotNull, Positive) - 식단 내 표시 순서
}

export interface CreateMyDietRequest {
  recordedAt: string; // ISO datetime 형식 (e.g. "2025-12-01T00:00:00")
  mealType: DietTimeSlot; // "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
  items: CreateMyDietItemRequest[];
  imageUrl?: string;
}

// 백엔드 응답은 ResponseEntity<Long> 형태로 보임(식단 기록 ID)
export type CreateMyDietResponse = number;

export interface DeleteMyDietResponse {
  dietId: number;
  deleted: boolean;
  deletedAt: string; // ISO string (e.g. 2025-12-05T12:00:00)
}

export interface UpdateMyDietItemRequest {
  foodId: number;
  serveCount: number;
  orderIndex: number;
}

export interface UpdateMyDietRequest {
  recordedAt: string;
  mealType: DietTimeSlot;
  items: UpdateMyDietItemRequest[];
  imageUrl?: string;
}

export interface UpdateMyDietItemResponse {
  dietItemId: number;
  foodId: number;
  name: string;
  amount: number;
  unit: string;
  calories: number;
}

export interface UpdateMyDietResponse {
  dietId: number;
  date: string; // YYYY-MM-DD
  timeSlot: DietTimeSlot;
  memo?: string;
  totalCalories: number;
  items: UpdateMyDietItemResponse[];
  updatedAt: string; // ISO string (e.g. 2025-12-05T12:10:00)
}

export interface MyDietItem {
  dietItemId: number;
  foodId: number;
  name: string;
  amount: number;
  unit: string;
  calories: number;
}

export interface MyDiet {
  dietId: number;
  timeSlot: DietTimeSlot;
  totalCalories: number;
  items: MyDietItem[];
  imageUrl?: string;
}

export interface GetMyDietsResponse {
  date: string; // YYYY-MM-DD
  diets: MyDiet[];
}

export interface GetMyDietDetailResponse {
  dietId: number;
  date: string; // YYYY-MM-DD
  timeSlot: DietTimeSlot;
  memo?: string;
  totalCalories: number;
  items: MyDietItem[];
  createdAt: string; // ISO string (e.g. 2025-12-05T08:30:00)
  updatedAt: string; // ISO string (e.g. 2025-12-05T09:00:00)
  recordedAt?: string; // 식사 시간 (ISO string)
  imageUrl?: string; // 이미지 URL (상대 경로)
}

export default {
  // Diet
  getDailyDiet: (date: string) => api.get(`/diets?date=${date}`),
  logMeal: (data: any) => api.post(`/diets`, data),

  /**
   * 내 식단 한 건 추가
   * POST /api/me/diets
   */
  createMyDiet: (data: CreateMyDietRequest) => api.post<CreateMyDietResponse>(`/me/diets`, data),

  /**
   * 내 식단 한 건 삭제
   * DELETE /api/me/diets/{dietId}
   */
  deleteMyDiet: (dietId: number) => api.delete<DeleteMyDietResponse>(`/me/diets/${dietId}`),

  /**
   * 내 식단 한 건 수정
   * PUT /api/me/diets/{dietId}
   */
  updateMyDiet: (dietId: number, data: UpdateMyDietRequest) =>
    api.put<UpdateMyDietResponse>(`/me/diets/${dietId}`, data),

  /**
   * 특정 날짜의 내 식단 기록 전체 조회
   * GET /api/me/diets?date=YYYY-MM-DD
   */
  getMyDiets: (date: string) => api.get<GetMyDietsResponse>(`/me/diets`, { params: { date } }),

  /**
   * 내 특정 식단 한 건의 상세 내역 조회
   * GET /api/me/diets/{dietId}
   */
  getMyDietDetail: (dietId: number) => api.get<GetMyDietDetailResponse>(`/me/diets/${dietId}`),

  // Foods
  /**
   * 전체 음식 목록 조회
   * GET /api/foods
   *
   * Authorization: Bearer {accessToken} (axios interceptor에서 자동 첨부)
   */
  getFoods: (params?: FoodListParams) => {
    console.log("🌐 [dietApi] getFoods 호출, params:", params);
    const result = api.get<FoodListResponse>(`/foods`, { params });
    result.then(
      (response) => {
        console.log("🌐 [dietApi] getFoods 응답:", response);
        console.log("🌐 [dietApi] response.data:", response.data);
      },
      (error) => {
        console.error("🌐 [dietApi] getFoods 에러:", error);
      }
    );
    return result;
  },

  /**
   * 음식 상세 조회
   * GET /api/foods/{foodId}
   *
   * Authorization: Bearer {accessToken} (axios interceptor에서 자동 첨부)
   */
  getFoodDetail: (foodId: number) => api.get<Food>(`/foods/${foodId}`),
};
