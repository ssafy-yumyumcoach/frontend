import api from "@/api/axios";

const BASE_URL = "/me/stats";

export default {
  /**
   * 주간 통계 조회
   * GET /api/me/stats/week?date=YYYY-MM-DD
   */
  getWeeklyStats: (date: string) => api.get(`${BASE_URL}/week`, { params: { date } }),
};
