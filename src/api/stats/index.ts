import api from '@/api/axios';

const BASE_URL = '/stats';

export default {
    getWeeklyStats: () => api.get(`${BASE_URL}/weekly`),
    getMonthlyStats: () => api.get(`${BASE_URL}/monthly`),
};
