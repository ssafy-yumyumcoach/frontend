import { defineStore } from "pinia";
import { ref } from "vue";
import communityApi, {
  type PostSummary,
  type PostCreateRequest,
  type PostUpdateRequest,
  type PostDetailResponse,
  type CommentResponse,
  type CommentRequest,
} from "@/api/community";

export interface CommunityParams {
  page: number;
  size: number;
  keyword?: string;
  type?: string;
}

export const useCommunityStore = defineStore("community", () => {
  // --- State ---
  const posts = ref<PostSummary[]>([]);
  const post = ref<PostDetailResponse | null>(null);
  const comments = ref<CommentResponse[]>([]);
  
  const totalPosts = ref(0);
  const isLoading = ref(false);
  const error = ref<any>(null);

  // --- Actions ---

  // 1. Fetch Posts (List)
  const fetchPosts = async (params: CommunityParams, isMyPosts = false) => {
    isLoading.value = true;
    error.value = null;
    try {
      let response;
      if (isMyPosts) {
        response = await communityApi.getMyPosts(params);
      } else {
        response = await communityApi.getPosts(params);
      }
      
      posts.value = response.data.posts;
      totalPosts.value = response.data.totalCount || 0;
    } catch (e) {
      console.error("Failed to fetch posts:", e);
      error.value = e;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Fetch Post Detail
  const fetchPostDetail = async (postId: number) => {
    isLoading.value = true;
    error.value = null;
    post.value = null; 
    comments.value = [];
    try {
      const [postRes, commentRes] = await Promise.all([
        communityApi.getPostDetail(postId),
        communityApi.getCommentsByPost(postId),
      ]);

      post.value = postRes.data;
      if (commentRes.data && Array.isArray(commentRes.data.comments)) {
        comments.value = commentRes.data.comments;
      } else {
        comments.value = [];
      }
    } catch (e) {
      console.error("Failed to fetch post detail:", e);
      error.value = e;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Create Post
  const createPost = async (data: PostCreateRequest) => {
    isLoading.value = true;
    try {
      await communityApi.createPost(data);
    } catch (e) {
      console.error("Failed to create post:", e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // 4. Update Post
  const updatePost = async (postId: number, data: PostUpdateRequest) => {
    isLoading.value = true;
    try {
      const res = await communityApi.updatePost(postId, data);
      // Update local state if it matches
      if (post.value && post.value.postId === postId) {
        post.value = { ...post.value, ...res.data };
      }
      return res.data;
    } catch (e) {
      console.error("Failed to update post:", e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // 5. Delete Post
  const deletePost = async (postId: number) => {
    try {
      await communityApi.deletePost(postId);
      // Remove from list if present
      posts.value = posts.value.filter((p) => p.postId !== postId);
    } catch (e) {
      console.error("Failed to delete post:", e);
      throw e;
    }
  };

  // 6. Like / Unlike
  const toggleLike = async (postId: number) => {
    if (!post.value || post.value.postId !== postId) return;

    try {
      if (post.value.isLikedByMe) {
        const res = await communityApi.unlikePost(postId);
        post.value.isLikedByMe = false;
        post.value.likeCount = res.data?.likeCount ?? post.value.likeCount - 1;
      } else {
        const res = await communityApi.likePost(postId);
        post.value.isLikedByMe = true;
        post.value.likeCount = res.data?.likeCount ?? post.value.likeCount + 1;
      }
    } catch (e) {
      console.error("Failed to toggle like:", e);
      throw e;
    }
  };

  // 7. Create Comment
  const createComment = async (postId: number, data: CommentRequest) => {
    try {
      const res = await communityApi.createComment(postId, data);
      const newComment = res.data;
      comments.value.push(newComment);
      if (post.value) post.value.commentCount++;
      return newComment;
    } catch (e) {
      console.error("Failed to create comment:", e);
      throw e;
    }
  };

  // 8. Update Comment
  const updateComment = async (postId: number, commentId: number, data: CommentRequest) => {
    try {
      const res = await communityApi.updateComment(postId, commentId, data);
      const target = comments.value.find((c) => c.commentId === commentId);
      if (target) {
        target.content = res.data.content;
        target.updatedAt = res.data.updatedAt;
      }
      return res.data;
    } catch (e) {
      console.error("Failed to update comment:", e);
      throw e;
    }
  };

  // 9. Delete Comment
  const deleteComment = async (postId: number, commentId: number) => {
    try {
      await communityApi.deleteComment(postId, commentId);
      comments.value = comments.value.filter((c) => c.commentId !== commentId);
      if (post.value) post.value.commentCount--;
    } catch (e) {
      console.error("Failed to delete comment:", e);
      throw e;
    }
  };

  return {
    // State
    posts,
    post,
    comments,
    totalPosts,
    isLoading,
    error,

    // Actions
    fetchPosts,
    fetchPostDetail,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    createComment,
    updateComment,
    deleteComment,
  };
});
