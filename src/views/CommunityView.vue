<script setup lang="ts">
import { ref } from "vue";
import { Heart, MessageCircle, ImagePlus, Send } from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Dialog from "@/components/ui/Dialog.vue";
import Label from "@/components/ui/Label.vue";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
}

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  time: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  commentsList?: Comment[];
  showComments?: boolean;
  newComment?: string;
}

// State
const isWriteDialogOpen = ref(false);
const newPostTitle = ref("");
const newPostContent = ref("");
const expandedPosts = ref<Set<string>>(new Set());

// Mock Data
const posts = ref<Post[]>([
  {
    id: "1",
    author: { name: "김건강", avatar: "" },
    time: "오늘 19:32",
    content:
      "2주 저녁 샐러드 챌린지 7일차 인증합니다! 🥗 매일 저녁마다 샐러드 먹는 게 처음엔 힘들었는데, 이제는 몸이 가벼워지는 게 느껴져요. 같이 하시는 분들 화이팅! https://challenge/evening-salad",
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    ],
    likes: 24,
    comments: 5,
    isLiked: false,
    commentsList: [
      {
        id: "c1",
        author: { name: "이샐러드", avatar: "" },
        content: "저도 도전해보고 싶네요! 식단 공유 감사해요.",
        time: "10분 전",
      },
      { id: "c2", author: { name: "박헬스", avatar: "" }, content: "화이팅입니다! 꾸준함이 답이죠.", time: "5분 전" },
    ],
    showComments: false,
    newComment: "",
  },
  {
    id: "2",
    author: { name: "박다이어트", avatar: "" },
    time: "오늘 17:15",
    content:
      "오늘 점심 도시락 메뉴 공유해요! 현미밥 + 닭가슴살 + 브로콜리 + 방울토마토. 단백질 40g 섭취 완료 💪 간단하게 만들 수 있어서 추천합니다.",
    images: ["https://images.unsplash.com/photo-1633945274551-e63d5a2ca6dc?w=400"],
    likes: 18,
    comments: 3,
    isLiked: true,
    commentsList: [],
    showComments: false,
    newComment: "",
  },
  {
    id: "3",
    author: { name: "이러너", avatar: "" },
    time: "오늘 15:42",
    content:
      "아침 5km 런닝 완료! 🏃‍♂️ 요즘 날씨가 좋아서 운동하기 딱이에요. 오늘도 350kcal 소모했습니다. 다들 오늘 하루도 파이팅하세요!",
    images: ["https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400"],
    likes: 31,
    comments: 7,
    isLiked: false,
    commentsList: [],
    showComments: false,
    newComment: "",
  },
  {
    id: "4",
    author: { name: "최헬스", avatar: "" },
    time: "오늘 12:20",
    content:
      "30일 플랭크 챌린지 시작합니다! 💪 처음엔 30초도 힘들었는데 이제 1분 30초까지 버틸 수 있게 됐어요. 같이 하실 분 있으면 댓글 남겨주세요! https://challenge/30-day-plank",
    likes: 42,
    comments: 12,
    isLiked: true,
    commentsList: [],
    showComments: false,
    newComment: "",
  },
  {
    id: "5",
    author: { name: "정식단", avatar: "" },
    time: "어제 21:45",
    content:
      "저녁 간단하게 두부 스테이크 만들어 먹었어요 🍽️ 두부를 팬에 노릇하게 굽고 간장 소스 뿌리면 끝! 칼로리도 낮고 단백질도 풍부해서 다이어트 중이신 분들께 강추합니다. 레시피 궁금하신 분은 댓글 주세요!",
    images: [
      "https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=400",
      "https://images.unsplash.com/photo-1611171711747-8b9f38e3ff08?w=400",
      "https://images.unsplash.com/photo-1546548970-71785318a17b?w=400",
    ],
    likes: 56,
    comments: 15,
    isLiked: false,
    commentsList: [],
    showComments: false,
    newComment: "",
  },
]);

// Actions
const toggleLike = (postId: string) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
  }
};

const toggleExpand = (postId: string) => {
  if (expandedPosts.value.has(postId)) {
    expandedPosts.value.delete(postId);
  } else {
    expandedPosts.value.add(postId);
  }
};

const toggleComments = (postId: string) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post) {
    post.showComments = !post.showComments;
  }
};

const addComment = (postId: string) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post && post.newComment?.trim()) {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "홍길동",
        avatar: "",
      },
      content: post.newComment,
      time: "방금 전",
    };

    if (!post.commentsList) post.commentsList = [];
    post.commentsList.push(newComment);
    post.comments += 1;
    post.newComment = "";
  }
};

const handleSubmitPost = () => {
  if (!newPostContent.value.trim()) return;

  const newPost: Post = {
    id: Date.now().toString(),
    author: {
      name: "홍길동",
      avatar: "",
    },
    time: "방금 전",
    content: newPostContent.value,
    likes: 0,
    comments: 0,
    isLiked: false,
    commentsList: [],
    showComments: false,
    newComment: "",
  };

  posts.value.unshift(newPost);
  newPostContent.value = "";
  newPostTitle.value = "";
  isWriteDialogOpen.value = false;
};

// Helper to parse content with URLs
const parseContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.split(urlRegex).map((part) => ({
    text: part,
    isUrl: !!part.match(urlRegex),
  }));
};
</script>

<template>
  <div class="space-y-6">
    <!-- 상단 - 글 작성하기 버튼 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl text-white">전체 피드</h2>
      <Button class="bg-emerald-500 hover:bg-emerald-600 text-white" @click="isWriteDialogOpen = true">
        <Send class="w-4 h-4 mr-2" />
        글 작성하기
      </Button>
    </div>

    <!-- 피드 리스트 -->
    <div class="space-y-6">
      <div v-for="post in posts" :key="post.id" class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <!-- 프로필 -->
        <div class="flex items-center gap-3">
          <Avatar :src="post.author.avatar" :fallback="post.author.name[0]" class="w-11 h-11" />
          <div class="flex-1">
            <div class="text-white font-medium">{{ post.author.name }}</div>
            <div class="text-sm text-zinc-400">{{ post.time }}</div>
          </div>
        </div>

        <!-- 본문 -->
        <div>
          <p class="text-zinc-200 leading-relaxed whitespace-pre-wrap">
            <template v-for="(part, index) in parseContent(post.content)" :key="index">
              <a v-if="part.isUrl" href="#" class="text-emerald-400 hover:text-emerald-300 underline" @click.prevent>
                {{ part.text }}
              </a>
              <span v-else>
                {{
                  !expandedPosts.has(post.id) && post.content.length > 150
                    ? part.text.slice(0, 150) + (index === 0 ? "..." : "")
                    : part.text
                }}
              </span>
            </template>
          </p>
          <button
            v-if="post.content.length > 150"
            @click="toggleExpand(post.id)"
            class="text-zinc-400 hover:text-white text-sm mt-2"
          >
            {{ expandedPosts.has(post.id) ? "접기" : "더보기" }}
          </button>
        </div>

        <!-- 이미지 -->
        <div
          v-if="post.images && post.images.length > 0"
          class="grid gap-2"
          :class="{
            'grid-cols-1': post.images.length === 1,
            'grid-cols-2': post.images.length === 2,
            'grid-cols-3': post.images.length >= 3,
          }"
        >
          <div
            v-for="(image, index) in post.images"
            :key="index"
            class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
          >
            <img
              :src="image"
              :alt="`Post image ${index + 1}`"
              class="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            />
          </div>
        </div>

        <!-- 하단 액션 -->
        <div class="flex items-center gap-6 pt-3 border-t border-zinc-800">
          <button
            @click="toggleLike(post.id)"
            class="flex items-center gap-2 transition-colors"
            :class="post.isLiked ? 'text-red-500 hover:text-red-400' : 'text-zinc-400 hover:text-white'"
          >
            <Heart class="w-5 h-5" :class="{ 'fill-current': post.isLiked }" />
            <span>{{ post.likes }}</span>
          </button>
          <button
            @click="toggleComments(post.id)"
            class="flex items-center gap-2 transition-colors"
            :class="post.showComments ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'"
          >
            <MessageCircle class="w-5 h-5" />
            <span>{{ post.comments }}</span>
          </button>
        </div>

        <!-- 댓글 섹션 -->
        <div v-if="post.showComments" class="pt-4 space-y-4 border-t border-zinc-800/50">
          <!-- 댓글 목록 -->
          <div v-if="post.commentsList && post.commentsList.length > 0" class="space-y-4">
            <div v-for="comment in post.commentsList" :key="comment.id" class="flex gap-3">
              <Avatar :src="comment.author.avatar" :fallback="comment.author.name[0]" class="w-8 h-8" />
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-white">{{ comment.author.name }}</span>
                  <span class="text-xs text-zinc-500">{{ comment.time }}</span>
                </div>
                <p class="text-sm text-zinc-300">{{ comment.content }}</p>
              </div>
            </div>
          </div>

          <!-- 댓글 입력 -->
          <div class="flex gap-3 pt-2">
            <Avatar src="" fallback="홍" class="w-8 h-8" />
            <div class="flex-1 flex gap-2">
              <Input
                v-model="post.newComment"
                placeholder="댓글을 입력하세요..."
                class="bg-zinc-800 border-zinc-700 text-white h-9 text-sm"
                @keyup.enter="addComment(post.id)"
              />
              <Button
                size="sm"
                class="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4"
                @click="addComment(post.id)"
                :disabled="!post.newComment?.trim()"
              >
                등록
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 글 작성 다이얼로그 -->
    <Dialog v-model:open="isWriteDialogOpen" title="새 글 작성">
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label class="text-zinc-300">제목 (선택)</Label>
          <Input
            v-model="newPostTitle"
            placeholder="제목을 입력하세요"
            class="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-zinc-300">내용</Label>
          <Textarea
            v-model="newPostContent"
            placeholder="내용을 입력하세요. 챌린지 링크를 포함할 수 있습니다."
            :rows="8"
            class="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-zinc-300">이미지 (선택)</Label>
          <Button
            variant="outline"
            class="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <ImagePlus class="w-4 h-4 mr-2" />
            이미지 업로드
          </Button>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-4">
        <Button
          variant="outline"
          @click="isWriteDialogOpen = false"
          class="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          취소
        </Button>
        <Button @click="handleSubmitPost" class="bg-emerald-500 hover:bg-emerald-600 text-white"> 게시하기 </Button>
      </div>
    </Dialog>
  </div>
</template>
