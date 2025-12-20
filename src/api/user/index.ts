import api from '@/api/axios';

const BASE_URL = '/users';

export default {
    getProfile: () => api.get(`${BASE_URL}/profile`),
    updateProfile: (data: any) => api.put(`${BASE_URL}/profile`, data),
};
