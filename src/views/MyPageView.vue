<script setup lang="ts">
import { ref } from "vue";
import { Upload, LogOut, Save, Lock } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Avatar from "@/components/ui/Avatar.vue";
import Checkbox from "@/components/ui/Checkbox.vue";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: "초급" | "중급" | "고급";
  acquired: boolean;
  acquiredDate?: string;
}

// Profile State
const profileImage = ref<string>("");
const nickname = ref("홍길동");
const email = ref("hong@example.com");
const bio = ref("");

// Health Info State
const height = ref("170");
const weight = ref("65");
const targetWeight = ref("60");
const diseases = ref<string[]>([]);
const otherDisease = ref("");
const goals = ref<string[]>(["weight-loss"]);
const otherGoal = ref("");
const activityLevel = ref("medium");

// Badge Data
const badges = ref<Badge[]>([
  {
    id: "1",
    name: "11월 식단 기록 챌린지",
    description: "11월 식단 기록 챌린지 완료",
    icon: "🥗",
    difficulty: "중급",
    acquired: true,
    acquiredDate: "2025. 11. 15",
  },
  {
    id: "2",
    name: "10월 운동 습관 챌린지",
    description: "10월 운동 습관 챌린지 완료",
    icon: "💪",
    difficulty: "고급",
    acquired: true,
    acquiredDate: "2025. 10. 31",
  },
  {
    id: "3",
    name: "11월 단백질 챌린지",
    description: "11월 단백질 챌린지 완료",
    icon: "🥩",
    difficulty: "초급",
    acquired: false,
  },
  {
    id: "4",
    name: "12월 챌린지",
    description: "12월 챌린지 참여 예정",
    icon: "🎯",
    difficulty: "중급",
    acquired: false,
  },
]);

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

const activityOptions = [
  {
    id: "low",
    label: "낮음",
    description: "하루 대부분 앉아서 생활해요",
  },
  {
    id: "medium",
    label: "보통",
    description: "가벼운 활동이나 주 1~2회 운동을 해요",
  },
  {
    id: "high",
    label: "높음",
    description: "하루 활동량이 많거나 주 3회 이상 운동해요",
  },
];

const triggerFileInput = () => {
  document.getElementById("profile-image")?.click();
};

const handleProfileImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
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

const handleProfileSave = () => {
  console.log("프로필 저장:", { nickname: nickname.value, bio: bio.value });
};

const handleHealthInfoSave = () => {
  console.log("건강 정보 저장:", {
    height: height.value,
    weight: weight.value,
    targetWeight: targetWeight.value,
    diseases: diseases.value,
    otherDisease: otherDisease.value,
    goals: goals.value,
    otherGoal: otherGoal.value,
    activityLevel: activityLevel.value,
  });
};

const handleLogout = () => {
  console.log("로그아웃");
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "초급":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "중급":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "고급":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- 섹션 1: 프로필 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- 좌측: 아바타 -->
          <div class="flex flex-col items-center gap-4">
            <Avatar :src="profileImage" :fallback="nickname.charAt(0)" class="w-32 h-32 text-4xl" />
            <div>
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                @change="handleProfileImageUpload"
                class="hidden"
              />
              <label for="profile-image">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 cursor-pointer"
                  @click="triggerFileInput"
                >
                  <Upload class="w-4 h-4 mr-2" />
                  이미지 변경
                </Button>
              </label>
            </div>
          </div>

          <!-- 우측: 프로필 정보 -->
          <div class="flex-1 space-y-5">
            <div class="space-y-2">
              <Label for="nickname" class="text-zinc-300">닉네임</Label>
              <Input id="nickname" v-model="nickname" class="bg-zinc-800 border-zinc-700 text-white" />
            </div>

            <div class="space-y-2">
              <Label for="email" class="text-zinc-300">이메일</Label>
              <Input
                id="email"
                v-model="email"
                readonly
                class="bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div class="space-y-2">
              <Label for="bio" class="text-zinc-300">한 줄 소개 (선택)</Label>
              <Textarea
                id="bio"
                v-model="bio"
                placeholder="자신을 소개해주세요"
                class="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <Button @click="handleProfileSave" class="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Save class="w-4 h-4 mr-2" />
                프로필 편집
              </Button>
              <Button
                @click="handleLogout"
                variant="outline"
                class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <LogOut class="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 섹션 2: 뱃지 컬렉션 -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl text-white">뱃지 컬렉션</h2>
          <div class="text-sm text-zinc-400">
            획득: {{ badges.filter((b) => b.acquired).length }} / {{ badges.length }}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="relative p-5 rounded-xl border-2 transition-all"
            :class="badge.acquired ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-50'"
          >
            <div v-if="!badge.acquired" class="absolute top-3 right-3">
              <Lock class="w-4 h-4 text-zinc-600" />
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

              <div class="flex justify-center">
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
          <p class="text-zinc-400 text-sm">💡 챌린지를 완료하면 난이도에 따라 다른 등급의 뱃지를 획득할 수 있어요.</p>
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
    </div>
  </div>
</template>
