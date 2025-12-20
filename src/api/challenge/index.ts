import api from '@/api/axios';

const BASE_URL = '/challenges';

export default {
    getChallenges: () => api.get(BASE_URL),
    joinChallenge: (id: string) => api.post(`${BASE_URL}/${id}/join`),
};
