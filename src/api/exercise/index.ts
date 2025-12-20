import api from '@/api/axios';

const BASE_URL = '/exercises';

export default {
    getExercises: () => api.get(BASE_URL),
    logExercise: (data: any) => api.post(BASE_URL, data),
};
