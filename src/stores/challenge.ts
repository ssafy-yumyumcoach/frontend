import { defineStore } from "pinia";
import { ref } from "vue";
import challengeApi, { type ChallengeSummary, type ChallengeDetailResponse } from "@/api/challenge";

export const useChallengeStore = defineStore("challenge", () => {
  // --- State ---
  const challenges = ref<ChallengeSummary[]>([]);
  const challenge = ref<ChallengeDetailResponse | null>(null);
  const isLoading = ref(false);

  // --- Actions ---

  // 1. Fetch Challenges for List View (Current & Next Month)
  const fetchAllChallengesForListView = async () => {
    isLoading.value = true;
    try {
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      
      const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

      const [resCurrent, resNext] = await Promise.all([
        challengeApi.getChallenges(currentMonth),
        challengeApi.getChallenges(nextMonth),
      ]);

      const merged = [...resCurrent.data.challenges, ...resNext.data.challenges];

      // Remove duplicates based on challengeId
      const unique = merged.filter((c, index, self) => index === self.findIndex((t) => t.challengeId === c.challengeId));

      challenges.value = unique;
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Fetch Challenge Detail
  const fetchChallengeDetail = async (challengeId: number) => {
    isLoading.value = true;
    challenge.value = null; // Reset previous
    try {
      const res = await challengeApi.getChallengeDetail(challengeId);
      challenge.value = res.data;
    } catch (error) {
      console.error("Failed to fetch challenge detail:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Join Challenge
  const joinChallenge = async (challengeId: number, difficultyCode: string) => {
    try {
      await challengeApi.joinChallenge(challengeId, difficultyCode);
      // Refresh detail if currently viewing it
      if (challenge.value && challenge.value.challengeId === challengeId) {
        await fetchChallengeDetail(challengeId);
      }
    } catch (error) {
      console.error("Failed to join challenge:", error);
      throw error;
    }
  };

  // 4. Leave Challenge
  const leaveChallenge = async (challengeId: number) => {
    try {
      await challengeApi.leaveChallenge(challengeId);
      // Refresh detail if currently viewing it
      if (challenge.value && challenge.value.challengeId === challengeId) {
        await fetchChallengeDetail(challengeId);
      }
    } catch (error) {
      console.error("Failed to leave challenge:", error);
      throw error;
    }
  };

  return {
    challenges,
    challenge,
    isLoading,
    fetchAllChallengesForListView,
    fetchChallengeDetail,
    joinChallenge,
    leaveChallenge,
  };
});
