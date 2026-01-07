<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { Upload, Save, Lock, X, Pencil } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Avatar from "@/components/ui/Avatar.vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import { type Title as ApiTitle, type UserSummary } from "@/api/user";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const { myPage, myPostCount, followList, isLoading } = storeToRefs(userStore);

// Interface for UI Badges
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: string | null;
  acquired: boolean;
  acquiredDate?: string;
}

// Local Editor State (synced with Store on mount/fetch)
const profileImage = ref<string>("");
const nickname = ref("");
const email = ref("");
const bio = ref("");
const userId = ref<number>(0);
const createdAt = ref("");
const selectedFile = ref<File | null>(null);

// Original Data for Diffing (Dirty Check)
const originalBasicInfo = ref({
  username: "",
  introduction: "",
  profileImageUrl: "",
});
const originalHealthInfo = ref<any>({});

// Health Info State
const height = ref("");
const weight = ref("");
const targetWeight = ref("");
const diseases = ref<string[]>([]);
const otherDisease = ref("");
const goals = ref<string[]>([]);
const otherGoal = ref("");
const activityLevel = ref("MODERATE");

const diseaseOptions = [
  { id: "diabetes", label: "당뇨" },
  { id: "hypertension", label: "고혈압" },
  { id: "hyperlipidemia", label: "고지혈증" },
  { id: "other", label: "기타" },
];

const goalOptions = [
  { id: "weight-loss", label: "체중 감량" },
  { id: "maintain", label: "체중 유지" },
  { id: "muscle-gain", label: "근육 증가" },
  { id: "disease-management", label: "질환 관리" },
  { id: "other", label: "기타" },
];

// Mapping helper
const goalMap: Record<string, string> = {
  "체중 감량": "weight-loss",
  "체중 유지": "maintain",
  "근육 증가": "muscle-gain",
  "질환 관리": "disease-management",
};

const activityOptions = [
  { id: "LOW", label: "낮음", description: "하루 대부분 앉아서 생활해요" },
  { id: "MODERATE", label: "보통", description: "가벼운 활동이나 주 1~2회 운동을 해요" },
  { id: "HIGH", label: "높음", description: "하루 활동량이 많거나 주 3회 이상 운동해요" },
];

// --- Badges & Follow Counts Computed ---
const badges = computed<Badge[]>(() => {
  if (!myPage.value) return [];
  return myPage.value.badges.titles.map((t) => ({
    id: t.titleId.toString(),
    name: t.name,
    description: t.description,
    icon: t.iconEmoji,
    difficulty: t.difficultyName,
    acquired: true,
    acquiredDate: t.obtainedAt ? t.obtainedAt.split("T")[0] : "",
  }));
});

const currentTitleId = computed(() => myPage.value?.badges.currentTitleId || null);
const currentTitleName = computed(() => myPage.value?.badges.currentTitleName || null);
const followersCount = computed(() => myPage.value?.follow.followersCount || 0);
const followingsCount = computed(() => myPage.value?.follow.followingsCount || 0);

// --- Fetch & Populate ---
const initMyPage = async () => {
  try {
    await userStore.fetchMyPage();
    if (myPage.value) {
      const data = myPage.value;
      // Populate Local State
      userId.value = data.basic.userId;
      email.value = data.basic.email;
      nickname.value = data.basic.username;
      profileImage.value = data.basic.profileImageUrl;
      bio.value = data.basic.introduction || "";
      createdAt.value = data.basic.createdAt;

      originalBasicInfo.value = {
        username: data.basic.username,
        introduction: data.basic.introduction || "",
        profileImageUrl: data.basic.profileImageUrl,
      };

      // Health
      const h = data.health;
      height.value = h.height?.toString() || "";
      weight.value = h.weight?.toString() || "";
      targetWeight.value = h.goalWeight?.toString() || "";
      activityLevel.value = h.activityLevel || "MODERATE";

      originalHealthInfo.value = { ...h };

      // Map Diseases
      const dList = [];
      if (h.hasDiabetes) dList.push("diabetes");
      if (h.hasHypertension) dList.push("hypertension");
      if (h.hasHyperlipidemia) dList.push("hyperlipidemia");
      if (h.otherDisease) {
        dList.push("other");
        otherDisease.value = h.otherDisease;
      }
      diseases.value = dList;

      // Map Goals
      goals.value = [];
      if (h.goal) {
        const foundKey = Object.keys(goalMap).find((key) => h.goal === key);
        if (foundKey) {
          goals.value.push(goalMap[foundKey]);
        } else {
          if (Object.values(goalMap).includes(h.goal)) {
            goals.value.push(h.goal);
          } else {
            goals.value.push("other");
            otherGoal.value = h.goal;
          }
        }
      }
    }
  } catch (error) {
    // Already logged in store
  }
};

onMounted(() => {
  initMyPage();
});

const handleProfileImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onloadend = () => {
      profileImage.value = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const toggleDisease = (id: string) => {
  if (diseases.value.includes(id)) {
    diseases.value = diseases.value.filter((d) => d !== id);
    if (id === "other") otherDisease.value = "";
  } else {
    diseases.value.push(id);
  }
};

const toggleGoal = (id: string) => {
  if (goals.value.includes(id)) {
    goals.value = goals.value.filter((g) => g !== id);
    if (id === "other") otherGoal.value = "";
  } else {
    goals.value.push(id);
  }
};

const handleProfileSave = async () => {
  try {
    const payload: any = {};
    let hasChanges = false;

    // 1. Image Upload
    if (selectedFile.value) {
      const objectKey = await userStore.uploadProfileImage(selectedFile.value);
      payload.profileImageUrl = objectKey;
      hasChanges = true;
    }

    // 2. Nickname
    if (nickname.value !== originalBasicInfo.value.username) {
      payload.username = nickname.value;
      hasChanges = true;
    }

    // 3. Bio
    if (bio.value !== originalBasicInfo.value.introduction) {
      payload.introduction = bio.value;
      hasChanges = true;
    }

    if (!hasChanges) {
      alert("변경 사항이 없습니다.");
      return;
    }

    await userStore.updateMyBasicInfo(payload);
    
    // Update original state to reflect new saved state
    // Note: store returns void, but updates store state.
    // We update our local 'original' refs for next diff
    if (payload.username) originalBasicInfo.value.username = payload.username;
    if (payload.introduction) originalBasicInfo.value.introduction = payload.introduction;
    if (payload.profileImageUrl) {
        // If we uploaded (objectKey), the store state profileImageUrl will be updated to full URL by logic in store.
        // We can grab it from store or just assume success.
        // Ideally we grab it from store to update originalBasicInfo correctly
        if (myPage.value) originalBasicInfo.value.profileImageUrl = myPage.value.basic.profileImageUrl;
    }

    alert("프로필이 저장되었습니다.");
    selectedFile.value = null;
  } catch (e: any) {
    if (e.response?.status === 409) {
      alert("이미 사용 중인 닉네임입니다.");
    } else {
      alert("프로필 저장 실패");
    }
  }
};

const handleHealthInfoSave = async () => {
  // 1. Determine selected goal string
  let selectedGoal: string | null = null;
  const standardGoals = ["weight-loss", "maintain", "muscle-gain", "disease-management"];
  const found = standardGoals.find((g) => goals.value.includes(g));

  if (found) {
    selectedGoal = Object.keys(goalMap).find((key) => goalMap[key] === found) || found;
  } else if (goals.value.includes("other")) {
    selectedGoal = otherGoal.value;
  }

  // 2. Construct current data object
  const currentData = {
    height: Number(height.value),
    weight: Number(weight.value),
    goalWeight: Number(targetWeight.value),
    activityLevel: activityLevel.value,
    hasDiabetes: diseases.value.includes("diabetes"),
    hasHypertension: diseases.value.includes("hypertension"),
    hasHyperlipidemia: diseases.value.includes("hyperlipidemia"),
    otherDisease: diseases.value.includes("other") ? otherDisease.value : null,
    goal: selectedGoal,
  };

  // 3. Diffing
  const payload: any = {};
  const original = originalHealthInfo.value;
  let hasChanges = false;

  if (currentData.height !== original.height) { payload.height = currentData.height; hasChanges = true; }
  if (currentData.weight !== original.weight) { payload.weight = currentData.weight; hasChanges = true; }
  if (currentData.goalWeight !== original.goalWeight) { payload.goalWeight = currentData.goalWeight; hasChanges = true; }
  if (currentData.activityLevel !== original.activityLevel) { payload.activityLevel = currentData.activityLevel; hasChanges = true; }

  if (currentData.hasDiabetes !== original.hasDiabetes) { payload.hasDiabetes = currentData.hasDiabetes; hasChanges = true; }
  if (currentData.hasHypertension !== original.hasHypertension) { payload.hasHypertension = currentData.hasHypertension; hasChanges = true; }
  if (currentData.hasHyperlipidemia !== original.hasHyperlipidemia) { payload.hasHyperlipidemia = currentData.hasHyperlipidemia; hasChanges = true; }

  if (currentData.otherDisease !== original.otherDisease) { payload.otherDisease = currentData.otherDisease; hasChanges = true; }
  if (currentData.goal !== original.goal) { payload.goal = currentData.goal; hasChanges = true; }

  if (!hasChanges) {
    alert("변경 사항이 없습니다.");
    return;
  }

  try {
    await userStore.updateMyHealthInfo(payload);
    Object.assign(originalHealthInfo.value, currentData);
    alert("건강 정보가 저장되었습니다.");
  } catch (e) {
    alert("건강 정보 저장 실패");
  }
};

// Withdrawal State
const showWithdrawalDialog = ref(false);
const withdrawalPassword = ref("");
const withdrawalStep = ref<"password" | "final-confirm" | "done">("password");
const isWithdrawing = ref(false);
const withdrawalErrorMessage = ref<string>("");
const withdrawalDoneMessage = ref<string>("");

const handleWithdrawClick = () => {
  showWithdrawalDialog.value = true;
  withdrawalStep.value = "password";
  withdrawalErrorMessage.value = "";
  withdrawalDoneMessage.value = "";
};

const handleWithdrawalCancel = () => {
  showWithdrawalDialog.value = false;
  withdrawalPassword.value = "";
  withdrawalStep.value = "password";
  isWithdrawing.value = false;
  withdrawalErrorMessage.value = "";
  withdrawalDoneMessage.value = "";
};

const handleDialogBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleWithdrawalCancel();
  }
};

const goToWithdrawalFinalConfirm = () => {
  withdrawalErrorMessage.value = "";
  if (!withdrawalPassword.value) {
    withdrawalErrorMessage.value = "비밀번호를 입력해주세요.";
    return;
  }
  withdrawalStep.value = "final-confirm";
};

const handleWithdrawalConfirm = async () => {
  if (isWithdrawing.value) return;
  withdrawalErrorMessage.value = "";
  if (!withdrawalPassword.value) {
    withdrawalErrorMessage.value = "비밀번호를 입력해주세요.";
    withdrawalStep.value = "password";
    return;
  }

  isWithdrawing.value = true;
  try {
    const message = await authStore.withdraw(withdrawalPassword.value);
    withdrawalDoneMessage.value = message || "회원 탈퇴가 완료되었습니다.";
    withdrawalStep.value = "done";
  } catch (error: any) {
    withdrawalErrorMessage.value = error?.message || "회원 탈퇴 중 오류가 발생했습니다.";
  } finally {
    isWithdrawing.value = false;
  }
};

const finishWithdrawalFlow = () => {
  handleWithdrawalCancel();
  router.push("/");
};

// Follow Modal
const showFollowModal = ref(false);
const followModalType = ref<"following" | "follower">("following");
const followModalTitle = ref("");
const isFollowLoading = ref(false);

const openFollowModal = async (type: "following" | "follower") => {
  showFollowModal.value = true;
  followModalType.value = type;
  followModalTitle.value = type === "following" ? "팔로잉 목록" : "팔로워 목록";
  isFollowLoading.value = true;

  try {
    await userStore.fetchFollowList(type);
  } catch (e) {
    alert(`${followModalTitle.value}을 불러오지 못했습니다.`);
  } finally {
    isFollowLoading.value = false;
  }
};

const closeFollowModal = () => {
  showFollowModal.value = false;
};

const handleSetTitle = async (badge: Badge) => {
  if (!badge.acquired) {
    alert("획득하지 않은 뱃지입니다.");
    return;
  }
  if (String(badge.id) === String(currentTitleId.value)) return;

  try {
    await userStore.updateMyCurrentTitle(Number(badge.id), badge.name);
    alert(`'${badge.name}' 뱃지가 대표 뱃지로 설정되었습니다.`);
  } catch (e) {
    alert("대표 뱃지 설정 실패");
  }
};

const handleUnsetTitle = async () => {
  if (!confirm("대표 뱃지를 해제하시겠습니까?")) return;

  try {
    await userStore.updateMyCurrentTitle(null);
    alert("대표 뱃지가 해제되었습니다.");
  } catch (e) {
    alert("뱃지 해제 실패");
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "초급": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "중급": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "고급": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
};
</script>


<template>
  <div v-if="isLoading" class="flex justify-center py-20">
    <div class="text-zinc-400">데이터를 불러오는 중...</div>
  </div>

  <div v-else class="space-y-6">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- 섹션 1: 프로필 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <!-- 좌측: 아바타 & 이미지 변경 -->
          <div class="flex flex-col items-center gap-4">
            <div class="relative group">
              <div class="relative overflow-hidden rounded-full">
                <Avatar :src="profileImage" :fallback="nickname.charAt(0)" class="w-32 h-32 text-4xl" />
              </div>
              <!-- Upload Overlay/Button -->
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                @change="handleProfileImageUpload"
                class="hidden"
              />
              <label
                for="profile-image"
                class="absolute bottom-0 right-0 bg-zinc-800 p-2 rounded-full border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors shadow-lg z-10"
                title="이미지 변경"
              >
                <Upload class="w-4 h-4 text-white" />
              </label>
            </div>
          </div>

          <!-- 우측: 프로필 정보 -->
          <div class="flex-1 space-y-6 w-full text-center md:text-left">
            <!-- 1. Nickname & Badge & Email -->
            <div class="space-y-2">
              <div class="flex flex-col md:flex-row items-center md:items-end gap-10 justify-center md:justify-start">
                <!-- Nickname Input -->
                <div class="relative">
                  <input
                    type="text"
                    v-model="nickname"
                    class="bg-transparent border-b border-zinc-700 hover:border-zinc-500 focus:border-emerald-500 transition-colors text-3xl font-bold text-white focus:outline-none w-full md:w-auto text-center md:text-left px-1 pb-1"
                  />
                  <Pencil class="w-4 h-4 text-zinc-600 absolute -right-6 top-1/2 -translate-y-1/2 md:block hidden" />
                </div>

                <!-- Badge Pill -->
                <span
                  v-if="currentTitleId"
                  class="text-sm px-3 py-1 rounded border mb-1 transition-colors"
                  :class="[
                    (() => {
                      const badge = badges.find((b) => b.id === String(currentTitleId));
                      return badge?.difficulty
                        ? getDifficultyColor(badge.difficulty)
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700';
                    })(),
                  ]"
                >
                  {{ badges.find((b) => b.id === String(currentTitleId))?.name || currentTitleName || "대표 뱃지" }}
                </span>
              </div>
              <div class="text-sm text-zinc-500">{{ email }}</div>
            </div>
            <!-- 2. Follow Stats & My Posts -->
            <div class="flex items-center justify-center md:justify-start gap-3">
              <div
                class="text-center cursor-pointer hover:bg-zinc-800 rounded-lg py-2 px-4 transition-all"
                @click="openFollowModal('follower')"
              >
                <div class="text-white font-bold text-xl">{{ followersCount }}</div>
                <div class="text-xs text-zinc-400">팔로워</div>
              </div>

              <!-- Divider -->
              <div class="w-px h-8 bg-zinc-800"></div>

              <div
                class="text-center cursor-pointer hover:bg-zinc-800 rounded-lg py-2 px-4 transition-all"
                @click="openFollowModal('following')"
              >
                <div class="text-white font-bold text-xl">{{ followingsCount }}</div>
                <div class="text-xs text-zinc-400">팔로잉</div>
              </div>
              
              <!-- Divider -->
              <div class="w-px h-8 bg-zinc-800"></div>

              <!-- My Posts Button -->
              <div 
                class="text-center cursor-pointer hover:bg-zinc-800 rounded-lg py-2 px-4 transition-all flex flex-col items-center gap-0.5"
                @click="router.push({ name: 'community-me' })"
              >
                 <div class="text-white font-bold text-xl">{{ myPostCount }}</div>
                 <div class="text-xs text-zinc-400 font-normal">내가 쓴 글</div>
              </div>
            </div>

            <!-- 3. Bio -->
            <div class="space-y-2">
              <Label for="bio" class="text-zinc-500 text-xs text-center md:text-left block">한 줄 소개</Label>
              <Textarea
                id="bio"
                v-model="bio"
                placeholder="자신을 소개해주세요"
                class="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 min-h-[80px] focus:bg-zinc-800 focus:border-emerald-500 transition-colors"
              />
            </div>

            <!-- 4. Save Button -->
            <div class="flex justify-center md:justify-end pt-2">
              <Button @click="handleProfileSave" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6">
                <Save class="w-4 h-4 mr-2" />
                프로필 저장
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 섹션 2: 뱃지 컬렉션 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-2xl text-white">뱃지 컬렉션</h2>
            <span v-if="badges.length > 0" class="text-sm bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              {{ badges.length }}개 획득
            </span>
          </div>
          <Button
            v-if="currentTitleId"
            @click="handleUnsetTitle"
            variant="outline"
            size="sm"
            class="text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-800"
          >
            뱃지 해제
          </Button>
        </div>

        <div v-if="badges.length === 0" class="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-2">
          <div class="text-4xl">📭</div>
          <p>아직 표시할 뱃지가 없습니다.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="relative p-5 rounded-xl border-2 transition-all cursor-pointer hover:border-emerald-500/50"
            :class="[
              badge.acquired ? 'bg-zinc-800/50' : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed',
              String(badge.id) === String(currentTitleId)
                ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-900/10'
                : 'border-zinc-700',
            ]"
            @click="handleSetTitle(badge)"
          >
            <div v-if="!badge.acquired" class="absolute top-3 right-3">
              <Lock class="w-4 h-4 text-zinc-600" />
            </div>

            <!-- Representative Badge Indicator -->
            <div v-if="String(badge.id) === String(currentTitleId)" class="absolute top-3 left-3">
              <span class="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded">대표</span>
            </div>

            <div class="space-y-3">
              <div class="text-4xl text-center">{{ badge.icon }}</div>

              <div class="space-y-1">
                <h3 class="text-center text-sm" :class="badge.acquired ? 'text-white' : 'text-zinc-500'">
                  {{ badge.name }}
                </h3>
                <p class="text-center text-xs" :class="badge.acquired ? 'text-zinc-400' : 'text-zinc-600'">
                  {{ badge.description }}
                </p>
              </div>

              <div class="flex justify-center" v-if="badge.difficulty">
                <span class="text-xs px-2 py-1 rounded-full border" :class="getDifficultyColor(badge.difficulty)">
                  {{ badge.difficulty }}
                </span>
              </div>

              <p v-if="badge.acquired && badge.acquiredDate" class="text-xs text-zinc-500 text-center pt-2">
                획득: {{ badge.acquiredDate }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <p class="text-zinc-400 text-sm">💡 뱃지를 클릭하여 대표 뱃지로 설정할 수 있습니다.</p>
        </div>
      </div>

      <!-- 섹션 3: 건강 정보 & 목표 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <h2 class="text-2xl text-white">건강 정보 & 목표</h2>

        <!-- 신체 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="height" class="text-zinc-300">키 (cm)</Label>
            <Input
              id="height"
              type="number"
              v-model="height"
              placeholder="170"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div class="space-y-2">
            <Label for="weight" class="text-zinc-300">몸무게 (kg)</Label>
            <Input
              id="weight"
              type="number"
              v-model="weight"
              placeholder="65"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div class="space-y-2">
            <Label for="targetWeight" class="text-zinc-300">목표 몸무게 (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              v-model="targetWeight"
              placeholder="60"
              class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        <!-- 질환 정보 -->
        <div class="space-y-3">
          <Label class="text-zinc-300">질병 여부 (해당되는 항목을 모두 선택)</Label>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="option in diseaseOptions" :key="option.id" class="space-y-2">
              <div class="flex items-center space-x-3">
                <Checkbox
                  :id="`disease-${option.id}`"
                  :checked="diseases.includes(option.id)"
                  @update:checked="() => toggleDisease(option.id)"
                />
                <label :for="`disease-${option.id}`" class="text-zinc-300 cursor-pointer">
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>
          <Input
            v-if="diseases.includes('other')"
            type="text"
            placeholder="직접 입력"
            v-model="otherDisease"
            class="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        <!-- 목표 -->
        <div class="space-y-3">
          <Label class="text-zinc-300">목표 (해당되는 항목을 모두 선택)</Label>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="option in goalOptions" :key="option.id" class="space-y-2">
              <div class="flex items-center space-x-3">
                <Checkbox
                  :id="`goal-${option.id}`"
                  :checked="goals.includes(option.id)"
                  @update:checked="() => toggleGoal(option.id)"
                />
                <label :for="`goal-${option.id}`" class="text-zinc-300 cursor-pointer">
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>
          <Input
            v-if="goals.includes('other')"
            type="text"
            placeholder="직접 입력"
            v-model="otherGoal"
            class="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        <!-- 활동 수준 -->
        <div class="space-y-3">
          <Label class="text-zinc-300">활동 수준</Label>
          <div class="space-y-3">
            <button
              v-for="option in activityOptions"
              :key="option.id"
              @click="activityLevel = option.id"
              class="w-full px-4 py-4 rounded-lg border transition-all text-left"
              :class="
                activityLevel === option.id
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
              "
            >
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div :class="activityLevel === option.id ? 'text-white' : 'text-zinc-300'">
                    {{ option.label }}
                  </div>
                  <div class="text-sm" :class="activityLevel === option.id ? 'text-white/80' : 'text-zinc-500'">
                    {{ option.description }}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 안내 문구 -->
        <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <p class="text-zinc-400 text-sm">💡 입력한 정보는 영양·운동 권장량 계산과 AI 추천에 사용돼요.</p>
        </div>

        <!-- 저장 버튼 -->
        <div class="flex justify-end pt-2">
          <Button @click="handleHealthInfoSave" class="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Save class="w-4 h-4 mr-2" />
            건강 정보 저장
          </Button>
        </div>
      </div>

      <!-- 섹션 4: 회원 탈퇴 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4">
        <h2 class="text-2xl text-white">회원 탈퇴</h2>

        <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
          <p class="text-zinc-300 text-sm">⚠️ 회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
          <ul class="text-zinc-400 text-sm space-y-1 ml-4 list-disc">
            <li>프로필 정보 및 건강 데이터</li>
            <li>식단 및 운동 기록</li>
            <li>챌린지 참여 내역 및 뱃지</li>
            <li>커뮤니티 게시글 및 댓글</li>
          </ul>
        </div>

        <div class="flex justify-end">
          <Button
            @click="handleWithdrawClick"
            variant="outline"
            class="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
          >
            회원 탈퇴
          </Button>
        </div>
      </div>
    </div>

    <!-- Follows Modal -->
    <Teleport to="body">
      <div
        v-if="showFollowModal"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        @click="closeFollowModal"
      >
        <div
          class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col max-h-[80vh]"
          @click.stop
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-white">{{ followModalTitle }}</h3>
            <button @click="closeFollowModal" class="text-zinc-400 hover:text-white">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="isFollowLoading" class="flex-1 flex justify-center items-center py-10">
            <div class="text-zinc-400">불러오는 중...</div>
          </div>

          <div v-else class="flex-1 overflow-y-auto space-y-4 pr-2">
            <div v-if="followList.length === 0" class="text-center text-zinc-500 py-8">
              {{ followModalType === "following" ? "팔로우하는 유저가 없습니다." : "나를 팔로우하는 유저가 없습니다." }}
            </div>
            <div v-for="user in followList" :key="user.userId" class="flex items-center gap-3">
              <Avatar :src="user.profileImageUrl" :fallback="user.username.charAt(0)" class="w-10 h-10" />
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">{{ user.username }}</div>
                <div class="text-xs text-zinc-500 truncate">{{ user.introduction || "소개가 없습니다." }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Withdrawal Dialog -->
    <Teleport to="body">
      <div
        v-if="showWithdrawalDialog"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        @click="handleDialogBackdropClick"
      >
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 space-y-6" @click.stop>
          <template v-if="withdrawalStep === 'password'">
            <div class="space-y-2">
              <h3 class="text-2xl text-white">회원 탈퇴</h3>
              <p class="text-zinc-400">회원 탈퇴를 진행하려면 비밀번호를 입력해주세요.</p>
            </div>

            <div
              v-if="withdrawalErrorMessage"
              class="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm"
            >
              {{ withdrawalErrorMessage }}
            </div>

            <div class="space-y-2">
              <Label class="text-zinc-300">비밀번호</Label>
              <Input
                type="password"
                v-model="withdrawalPassword"
                placeholder="비밀번호를 입력하세요"
                class="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                @keyup.enter="goToWithdrawalFinalConfirm"
              />
            </div>

            <div class="flex gap-3 justify-end">
              <Button
                type="button"
                @click="handleWithdrawalCancel"
                variant="outline"
                class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                취소
              </Button>
              <Button type="button" @click="goToWithdrawalFinalConfirm" class="bg-red-600 hover:bg-red-700 text-white">
                다음
              </Button>
            </div>
          </template>

          <template v-else-if="withdrawalStep === 'final-confirm'">
            <div class="space-y-2">
              <h3 class="text-2xl text-white">정말 탈퇴할까요?</h3>
              <p class="text-zinc-400">이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.</p>
            </div>

            <div
              v-if="withdrawalErrorMessage"
              class="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm"
            >
              {{ withdrawalErrorMessage }}
            </div>

            <div class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
              <p class="text-zinc-300 text-sm">삭제되는 항목</p>
              <ul class="text-zinc-400 text-sm space-y-1 ml-4 list-disc">
                <li>프로필 정보 및 건강 데이터</li>
                <li>식단 및 운동 기록</li>
                <li>챌린지 참여 내역 및 뱃지</li>
                <li>커뮤니티 게시글 및 댓글</li>
              </ul>
            </div>

            <div class="flex gap-3 justify-end">
              <Button
                type="button"
                @click="() => (withdrawalStep = 'password')"
                variant="outline"
                class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                :disabled="isWithdrawing"
              >
                뒤로
              </Button>
              <Button
                type="button"
                @click="handleWithdrawalConfirm"
                class="bg-red-600 hover:bg-red-700 text-white"
                :disabled="isWithdrawing"
              >
                <span v-if="isWithdrawing">처리 중...</span>
                <span v-else>탈퇴 확정</span>
              </Button>
            </div>
          </template>

          <template v-else>
            <div class="space-y-2">
              <h3 class="text-2xl text-white">탈퇴 완료</h3>
              <p class="text-zinc-400">{{ withdrawalDoneMessage || "처리가 완료되었습니다." }}</p>
            </div>

            <div class="flex justify-end">
              <Button
                type="button"
                @click="finishWithdrawalFlow"
                class="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                확인
              </Button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>
