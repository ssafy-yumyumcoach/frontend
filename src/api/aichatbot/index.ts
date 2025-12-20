import api from '@/api/axios';

const BASE_URL = '/ai-chatbot';

export default {
    sendMessage: (message: string) => api.post(`${BASE_URL}/chat`, { message }),
};
