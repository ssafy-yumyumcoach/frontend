import api from '@/api/axios';

const BASE_URL = '/community';

export default {
    getPosts: () => api.get(`${BASE_URL}/posts`),
    createPost: (data: any) => api.post(`${BASE_URL}/posts`, data),
};
