<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Heart, MessageCircle, ImagePlus, Send, X, Search, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-vue-next";
import Avatar from "@/components/ui/Avatar.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Dialog from "@/components/ui/Dialog.vue";
import Label from "@/components/ui/Label.vue";
import Select from "@/components/ui/Select.vue";
import Checkbox from "@/components/ui/Checkbox.vue";

import communityApi, { type PostSummary } from "@/api/community";
import imageApi from "@/api/image";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Feed State
const posts = ref<PostSummary[]>([]);
const isLoading = ref(false);
const searchKeyword = ref("");
const searchType = ref("all");
const currentPage = ref(1);
const totalPosts = ref(0);
const pageSize = 10;
const selectedPostIds = ref<Set<number>>(new Set());
const isEditMode = ref(false);

const isMyPostsMode = computed(() => route.name === "community-me");

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalPosts.value / pageSize));
});

// Switch out of edit mode when leaving "My Posts"
watch(isMyPostsMode, (newVal) => {
    if (!newVal) {
        isEditMode.value = false;
        selectedPostIds.value.clear();
    }
});

// Create Post State
const isWriteDialogOpen = ref(false);
const newPostTitle = ref("");
const newPostContent = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImages = ref<{ file: File; preview: string }[]>([]);

// --- Delete Logic ---
const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value;
    if (!isEditMode.value) {
        selectedPostIds.value.clear();
    }
};

const togglePostSelection = (postId: number) => {
  if (selectedPostIds.value.has(postId)) {
    selectedPostIds.value.delete(postId);
  } else {
    selectedPostIds.value.add(postId);
  }
};

const isAllSelected = computed(() => {
  if (posts.value.length === 0) return false;
  return posts.value.every((post) => selectedPostIds.value.has(post.postId));
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // If all are selected, deselect only the current page's posts (or clear all? - usually current page)
    // Let's clear current page posts from selection
    posts.value.forEach((post) => selectedPostIds.value.delete(post.postId));
  } else {
    // Select all visible posts
    posts.value.forEach((post) => selectedPostIds.value.add(post.postId));
  }
};

const handleDeleteSelected = async () => {
    if (selectedPostIds.value.size === 0) return;
    if (!confirm(`${selectedPostIds.value.size}개의 게시글을 삭제하시겠습니까?`)) return;

    try {
        const deletePromises = Array.from(selectedPostIds.value).map(id => communityApi.deletePost(id));
        await Promise.all(deletePromises);
        alert("선택한 게시글이 삭제되었습니다.");
        selectedPostIds.value.clear();
        fetchPosts(); 
    } catch (e) {
        console.error("Failed to delete posts:", e);
        alert("게시글 삭제 중 오류가 발생했습니다.");
    }
};

// --- Search / Fetch ---
const handleSearch = () => {
  const query: any = {};
  if (searchKeyword.value.trim()) {
    query.keyword = searchKeyword.value.trim();
  }
  if (searchType.value !== "all") {
    query.type = searchType.value;
  }
  query.page = 1;
  router.push({ query });
};

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  const query: any = { ...route.query, page };
  if (searchType.value !== "all") {
    query.type = searchType.value;
  }
  router.push({ query });
};

const fetchPosts = async () => {
  isLoading.value = true;
  selectedPostIds.value.clear();
  try {
    const keywordFromUrl = route.query.keyword as string;
    const typeFromUrl = (route.query.type as string) || "all";
    const pageFromUrl = Number(route.query.page) || 1;

    currentPage.value = pageFromUrl;
    searchType.value = typeFromUrl;

    const params: any = {
      page: pageFromUrl,
      size: pageSize,
    };
    
    if (keywordFromUrl) {
      params.keyword = keywordFromUrl;
      if (searchKeyword.value !== keywordFromUrl) {
        searchKeyword.value = keywordFromUrl;
      }
    } else {
      if (!keywordFromUrl && searchKeyword.value) {
        searchKeyword.value = "";
      }
    }

    let response;
    if (isMyPostsMode.value) {
        response = await communityApi.getMyPosts(params);
    } else {
        response = await communityApi.getPosts(params);
    }
    
    let fetchedPosts = response.data.posts;
    if (params.keyword) {
      const k = params.keyword.toLowerCase();
      fetchedPosts = fetchedPosts.filter((p) => {
        const inTitle = p.title.toLowerCase().includes(k);
        const inContent = 
          (p.content && p.content.toLowerCase().includes(k)) || 
          (p.contentPreview && p.contentPreview.toLowerCase().includes(k));

        if (searchType.value === "title") {
          return inTitle;
        } else {
          return inTitle || inContent;
        }
      });
    }

    posts.value = fetchedPosts;
    totalPosts.value = response.data.totalCount || 0;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [route.query.keyword, route.query.page, route.query.type, route.name],
  () => {
    fetchPosts();
  }
);

onMounted(() => {
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword as string;
  }
  if (route.query.type) {
    searchType.value = route.query.type as string;
  }
  fetchPosts();
});

// --- Navigation ---
const goToDetail = (postId: number) => {
  router.push({ name: "community-detail", params: { id: postId } });
};

const goToProfile = (userId: number) => {
  if (userId === authStore.user?.userId) {
    return;
  }
  router.push({ name: "user-profile", params: { id: userId } });
};

// --- Create Post Actions ---
const openWriteDialog = () => {
  isWriteDialogOpen.value = true;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          selectedImages.value.push({
            file,
            preview: e.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }
};

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1);
};

const handleSubmitPost = async () => {
  if (!newPostContent.value.trim()) return;

  try {
    const imageUrls: string[] = [];
    if (selectedImages.value.length > 0) {
      const uploadPromises = selectedImages.value.map((img) => imageApi.uploadImage(img.file, "POST"));
      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    }

    await communityApi.createPost({
      title: newPostTitle.value,
      content: newPostContent.value,
      images: imageUrls,
    });

    newPostContent.value = "";
    newPostTitle.value = "";
    selectedImages.value = [];
    if (fileInput.value) fileInput.value.value = "";
    isWriteDialogOpen.value = false;

    alert("게시글이 작성되었습니다.");
    fetchPosts();
  } catch (error: any) {
    console.error("Failed to create post:", error);
    alert("게시글 작성에 실패했습니다.");
  }
};

// Utilities
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 1000 * 60) {
    return "방금 전";
  }
  if (minutes < 60) {
    return `${minutes}분 전`;
  }
  if (hours < 24) {
    return `${hours}시간 전`;
  }
  if (days < 7) {
    return `${days}일 전`;
  }
  return date.toLocaleDateString();
};
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- Header & Write Button -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl text-white">
        {{ isMyPostsMode ? `내가 쓴 글 (${totalPosts})` : "전체 피드" }}
      </h2>
      
      <div v-if="isMyPostsMode" class="flex gap-2">
          <!-- Edit Toggle Button -->
          <Button
            variant="ghost"
            size="icon"
            class="text-zinc-400 hover:text-white"
            @click="toggleEditMode"
          >
             <X v-if="isEditMode" class="w-5 h-5" />
             <Pencil v-else class="w-5 h-5" />
          </Button>

          <template v-if="isEditMode">
            <!-- Select All Button -->
            <Button
              variant="outline"
              class="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              @click="toggleSelectAll"
            >
              {{ isAllSelected ? "전체 해제" : "전체 선택" }}
            </Button>

            <!-- Delete Button (Visible only in Edit Mode & Selection > 0) -->
            <Button 
              v-if="selectedPostIds.size > 0"
              variant="destructive"
              class="bg-red-500 hover:bg-red-600 text-white"
              @click="handleDeleteSelected"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              삭제 ({{ selectedPostIds.size }})
            </Button>
          </template>
      </div>
      <Button v-else class="bg-emerald-500 hover:bg-emerald-600 text-white" @click="openWriteDialog">
        <Send class="w-4 h-4 mr-2" />
        글 작성하기
      </Button>
    </div>

    <!-- Search Bar -->
    <div class="flex gap-2">
      <!-- Search Type Select -->
      <div class="w-32">
        <Select
          v-model="searchType"
          :options="[
            { label: '제목+내용', value: 'all' },
            { label: '제목', value: 'title' },
          ]"
          class="bg-zinc-900 border-zinc-800 text-white h-10"
        />
      </div>

      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
          placeholder="관심있는 내용을 검색해보세요 (예: 다이어트, 식단)"
          class="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 h-10"
        />
      </div>
      <Button @click="handleSearch" variant="outline" class="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-10 px-4">
        검색
      </Button>
    </div>

    <!-- Feed List -->
    <div v-if="isLoading" class="text-center text-zinc-500 py-10">로딩 중...</div>

    <div v-else class="space-y-4">
      <div
        v-for="post in posts"
        :key="post.postId"
        class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 transition flex h-48 relative"
        @click="isEditMode ? togglePostSelection(post.postId) : goToDetail(post.postId)"
      >
        <!-- Overlay Selection Checkbox -->
        <div 
          v-if="isMyPostsMode && isEditMode" 
          class="absolute top-3 left-3 z-20"
          @click.stop
        >
          <Checkbox 
            :checked="selectedPostIds.has(post.postId)"
            @update:checked="togglePostSelection(post.postId)"
            class="w-6 h-6 border-zinc-400 bg-black/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
        </div>

        <!-- Left Content Section -->
        <div class="flex-1 p-5 flex flex-col justify-between gap-3 min-w-0">
          <!-- Top Section: Author + Content -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div 
                @click.stop="!isEditMode && goToProfile(post.authorId)" 
                class="transition-opacity"
                :class="isEditMode ? '' : 'cursor-pointer hover:opacity-80'"
              >
                <Avatar :src="post.authorProfileImageUrl" :fallback="post.authorUsername?.[0]" class="w-8 h-8" />
              </div>
              <div 
                @click.stop="!isEditMode && goToProfile(post.authorId)" 
                class="transition-opacity"
                :class="isEditMode ? '' : 'cursor-pointer hover:underline'"
              >
                <div class="text-white text-sm font-medium">{{ post.authorUsername }}</div>
                <div class="text-xs text-zinc-400">{{ formatTime(post.createdAt) }}</div>
              </div>
            </div>

            <h3 class="text-lg font-semibold text-zinc-100 mb-1 line-clamp-1">{{ post.title }}</h3>
            <p class="text-zinc-400 text-sm line-clamp-2 leading-relaxed break-words">
              {{ post.contentPreview || post.content }}
            </p>
          </div>

          <!-- Bottom Section: Stats -->
          <div class="flex items-center gap-4 text-zinc-400 text-sm">
            <span class="flex items-center gap-1"> <Heart class="w-4 h-4" /> {{ post.likeCount }} </span>
            <span class="flex items-center gap-1"> <MessageCircle class="w-4 h-4" /> {{ post.commentCount }} </span>
          </div>
        </div>

        <!-- Right Image Section (With slight padding) -->
        <div v-if="post.thumbnailUrl || (post.images && post.images.length > 0)" class="w-48 h-full flex-shrink-0 p-2">
          <img
            :src="post.thumbnailUrl || post.images?.[0]"
            class="w-full h-full object-cover rounded-lg bg-zinc-800"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages >= 1 && totalPosts > 0" class="flex justify-center items-center gap-2 py-8">
        <Button
          variant="outline"
          size="icon"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
          class="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <ChevronLeft class="w-4 h-4" />
        </Button>

        <div class="flex gap-1">
          <Button
            v-for="page in totalPages"
            :key="page"
            variant="ghost"
            size="sm"
            :class="`w-8 h-8 p-0 ${currentPage === page ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
          class="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <ChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Write Post Dialog -->
    <Dialog v-model:open="isWriteDialogOpen" title="새 글 작성">
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label class="text-zinc-300">제목</Label>
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
            placeholder="내용을 입력하세요..."
            :rows="6"
            class="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <!-- Image Selection -->
        <div class="space-y-2">
          <Label class="text-zinc-300">이미지 (선택)</Label>
          <div class="grid grid-cols-4 gap-2 mb-2" v-if="selectedImages.length > 0">
            <div
              v-for="(img, idx) in selectedImages"
              :key="idx"
              class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
            >
              <img :src="img.preview" class="w-full h-full object-cover" />
              <button
                @click="removeImage(idx)"
                class="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" multiple @change="handleFileChange" />
          <Button
            variant="outline"
            class="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            @click="triggerFileInput"
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

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
