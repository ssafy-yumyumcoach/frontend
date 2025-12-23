import api from '@/api/axios';

const BASE_URL = '/ai-chatbot';

// Meal Plan Types
export interface MealPlanItem {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  foods: string[];
  calories: number;
  description?: string;
}

export interface MealPlanResponse {
  targetDate: string;
  generated: boolean;
  breakfast?: MealPlanItem;
  lunch?: MealPlanItem;
  dinner?: MealPlanItem;
  snack?: MealPlanItem;
}

export interface GenerateMealPlanRequest {
  targetDate: string;
}

const aiApi = {
  sendMessage: (message: string) => api.post(`${BASE_URL}/chat`, { message }),
  getMealPlan: (date: string) => api.get<MealPlanResponse>(`${BASE_URL}/meal-plan`, { params: { date } }),
  generateMealPlan: (data: GenerateMealPlanRequest) => api.post<MealPlanResponse>(`${BASE_URL}/meal-plan/generate`, data),
};

export default aiApi;
