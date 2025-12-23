import { defineStore } from "pinia";
import { ref } from "vue";
import dietApi, { 
  type CreateMyDietRequest, 
  type CreateMyDietResponse,
  type DeleteMyDietResponse 
} from "@/api/diet";
import axios from "axios";

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
}

export const useDietStore = defineStore("diet", () => {
  const isCreating = ref(false);
  const isDeleting = ref(false);
  const errorMessage = ref<string>("");
  const lastCreatedDietId = ref<CreateMyDietResponse | null>(null);
  const lastDeletedDietId = ref<number | null>(null);

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

  const deleteMyDiet = async (dietId: number) => {
    isDeleting.value = true;
    errorMessage.value = "";

    try {
      const response = await dietApi.deleteMyDiet(dietId);
      lastDeletedDietId.value = response.data.dietId;
      return response.data;
    } catch (error: unknown) {
      let message = "식단 삭제에 실패했습니다.";

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as ApiErrorResponse | undefined;
        const status = error.response.status;

        if (status === 401) {
          message = "액세스 토큰이 유효하지 않습니다.";
        } else if (status === 403) {
          message = "해당 식단을 삭제할 권한이 없습니다.";
        } else if (status === 404) {
          message = "삭제할 식단을 찾을 수 없습니다.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      errorMessage.value = message;
      throw new Error(message);
    } finally {
      isDeleting.value = false;
    }
  };

  return {
    isCreating,
    isDeleting,
    errorMessage,
    lastCreatedDietId,
    lastDeletedDietId,
    createMyDiet,
    deleteMyDiet,
    clearError,
  };
});


