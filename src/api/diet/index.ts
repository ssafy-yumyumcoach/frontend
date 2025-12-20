import api from '@/api/axios';

const BASE_URL = '/diets';

export default {
    getDailyDiet: (date: string) => api.get(`${BASE_URL}?date=${date}`),
    logMeal: (data: any) => api.post(`${BASE_URL}`, data),
};
