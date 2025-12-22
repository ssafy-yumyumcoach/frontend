import { defineStore } from "pinia";
import { ref } from "vue";
import dietApi, { type CreateMyDietRequest, type CreateMyDietResponse } from "@/api/diet";
import axios from "axios";

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
}

export const useDietStore = defineStore("diet", () => {
  const isCreating = ref(false);
  const errorMessage = ref<string>("");
  const lastCreatedDietId = ref<CreateMyDietResponse | null>(null);

  const clearError = () => {
    errorMessage.value = "";
  };

  const createMyDiet = async (payload: CreateMyDietRequest) => {
    isCreating.value = true;
    errorMessage.value = "";

    try {
      const response = await dietApi.createMyDiet(payload);
      lastCreatedDietId.value = response.data;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 저장에 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        if (data?.message) message = data.message;
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isCreating.value = false;
    }
  };

  return {
    isCreating,
    errorMessage,
    lastCreatedDietId,
    createMyDiet,
    clearError,
  };
});


