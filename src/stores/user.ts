import { defineStore } from "pinia";
import { ref } from "vue";
import userApi, {
  type MyPageResponse,
  type UserProfileResponse,
  type UserSummary,
  type BasicInfo,
  type HealthInfo,
} from "@/api/user";
import imageApi from "@/api/image";
import communityApi from "@/api/community";
import { useAuthStore } from "@/stores/auth";

export const useUserStore = defineStore("user", () => {
  const authStore = useAuthStore();

  // --- State ---
  const myPage = ref<MyPageResponse | null>(null);
  const myPostCount = ref(0);
  const userProfile = ref<UserProfileResponse | null>(null); // For viewing other users
  const followList = ref<UserSummary[]>([]);
  const isLoading = ref(false);

  // --- Helpers ---
  const cdnDomain = "https://d3sn2183nped6z.cloudfront.net/";

  const sanitizeUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.includes(cdnDomain + cdnDomain)) {
      return url.replace(cdnDomain + cdnDomain, cdnDomain);
    }
    if (!url.startsWith("http") && !url.startsWith("data:")) {
      const cleanKey = url.startsWith("/") ? url.slice(1) : url;
      return `${cdnDomain}${cleanKey}`;
    }
    return url;
  };

  // --- Actions ---

  const fetchMyPage = async () => {
    isLoading.value = true;
    try {
      const res = await userApi.getMyPage();
      const data = res.data;

      // Sanitize Profile Image URL
      if (data.basic.profileImageUrl) {
        data.basic.profileImageUrl = sanitizeUrl(data.basic.profileImageUrl);
      }

      myPage.value = data;

      // Fetch My Post Count
      // We can do this in parallel or sequentially.
      try {
        const postRes = await communityApi.getMyPosts({ size: 1 });
        myPostCount.value = postRes.data.totalCount || 0;
      } catch (e) {
        console.warn("Failed to fetch post count", e);
        myPostCount.value = 0;
      }
    } catch (error) {
      console.error("Failed to fetch my page:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const updateMyBasicInfo = async (payload: Partial<BasicInfo>) => {
    try {
      await userApi.updateMyBasicInfo(payload);
      
      // Update Store State
      if (myPage.value) {
        if (payload.username) myPage.value.basic.username = payload.username;
        if (payload.introduction) myPage.value.basic.introduction = payload.introduction;
        if (payload.profileImageUrl) {
           // The payload uses objectKey, but we want full URL in state? 
           // Or the View handles ensuring the URL is correct?
           // The View passed objectKey to API, but usually we want to display the full URL.
           // However, let's just re-fetch or construct the URL.
           // The logic in View line 308: `updates.profileImageUrl = ${cdnDomain}${payload.profileImageUrl}`
           // Let's do similar here.
           const fullUrl = sanitizeUrl(payload.profileImageUrl);
           myPage.value.basic.profileImageUrl = fullUrl;
        }
      }

      // Sync with Auth Store
      const authUpdates: any = {};
      if (payload.username) authUpdates.username = payload.username;
      if (payload.profileImageUrl) authUpdates.profileImageUrl = sanitizeUrl(payload.profileImageUrl);
      
      if (Object.keys(authUpdates).length > 0) {
        authStore.updateUser(authUpdates);
      }

    } catch (error) {
      console.error("Failed to update basic info:", error);
      throw error;
    }
  };

  const updateMyHealthInfo = async (payload: Partial<HealthInfo>) => {
    try {
      await userApi.updateMyHealthInfo(payload);
      // Update Store State locally to reflect changes immediately
      if (myPage.value) {
        Object.assign(myPage.value.health, payload);
      }
    } catch (error) {
      console.error("Failed to update health info:", error);
      throw error;
    }
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      const { data: presign } = await imageApi.getPresignedUrl({
        purpose: "PROFILE",
        fileName: file.name,
        contentType: file.type,
      });

      await imageApi.uploadToS3(presign.presignedUrl, file);
      return presign.objectKey;
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      throw error;
    }
  };

  const updateMyCurrentTitle = async (titleId: number | null, titleName?: string | null) => {
    try {
      await userApi.updateMyCurrentTitle(titleId);
      if (myPage.value) {
        myPage.value.badges.currentTitleId = titleId;
        // Optionally update name if provided, or find it from list
        if (titleName !== undefined) {
          myPage.value.badges.currentTitleName = titleName;
        } else if (titleId && myPage.value.badges.titles) {
            const t = myPage.value.badges.titles.find(t => t.titleId === titleId);
            if (t) myPage.value.badges.currentTitleName = t.name;
        } else {
            myPage.value.badges.currentTitleName = null;
        }
      }
    } catch (error) {
       console.error("Failed to update current title:", error);
       throw error;
    }
  };

  const fetchFollowList = async (type: "following" | "follower") => {
    // This might be better as a return value rather than store state, 
    // or store state if we want to cache it.
    // The view uses a modal. Let's start by just returning data or setting state.
    // View had `followList` ref.
    try {
      let res;
      if (type === "following") {
        res = await userApi.getMyFollowings();
      } else {
        res = await userApi.getMyFollowers();
      }

      const users = res.data.users.map((u: any) => ({
        ...u,
        profileImageUrl: sanitizeUrl(u.profileImageUrl),
      }));
      
      followList.value = users;
      return users;
    } catch (error) {
      console.error(`Failed to fetch ${type} list:`, error);
      throw error;
    }
  };

  // --- Other User Profile ---
  const fetchUserProfile = async (targetUserId: number) => {
    isLoading.value = true;
    userProfile.value = null;
    try {
      const res = await userApi.getUserProfile(targetUserId);
      const data = res.data;
      if (data.basic.profileImageUrl) {
        data.basic.profileImageUrl = sanitizeUrl(data.basic.profileImageUrl);
      }
      userProfile.value = data;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const followUser = async (targetUserId: number) => {
    try {
      await userApi.followUser(targetUserId);
      // Update local state if viewing that user
      if (userProfile.value && userProfile.value.basic.userId === targetUserId) {
        userProfile.value.follow.following = true;
        userProfile.value.follow.followersCount += 1;
      }
      // Also update myPage counts if loaded?
      if (myPage.value) {
        myPage.value.follow.followingsCount += 1;
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
      throw error;
    }
  };

  const unfollowUser = async (targetUserId: number) => {
    try {
      await userApi.unfollowUser(targetUserId);
      // Update local state if viewing that user
      if (userProfile.value && userProfile.value.basic.userId === targetUserId) {
        userProfile.value.follow.following = false;
        userProfile.value.follow.followersCount = Math.max(0, userProfile.value.follow.followersCount - 1);
      }
       // Also update myPage counts if loaded?
       if (myPage.value) {
        myPage.value.follow.followingsCount = Math.max(0, myPage.value.follow.followingsCount - 1);
      }
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      throw error;
    }
  };

  return {
    myPage,
    myPostCount,
    userProfile,
    followList,
    isLoading,
    fetchMyPage,
    updateMyBasicInfo,
    updateMyHealthInfo,
    uploadProfileImage,
    updateMyCurrentTitle,
    fetchFollowList,
    fetchUserProfile,
    followUser,
    unfollowUser,
  };
});
