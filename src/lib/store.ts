import type { Blog } from "@/controller/blogController";
import type { SuggestedUser, User } from "@/controller/userController";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FollowingUser extends User {
  profile?: {
    id?: string;
    bio?: string | null;
    pfp?: string | null;
    website?: string | null;
    birthdate?: string | null;
  } | null;
}

interface AppState {
  // User data
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Cache for user profiles
  userProfiles: Record<string, User>;
  setUserProfile: (username: string, user: User) => void;
  getUserProfile: (username: string) => User | null;

  // Blog data
  feedBlogs: Record<
    string,
    {
      data: Blog[];
      pagination: { hasMore: boolean; nextCursor: string | null };
      timestamp: number;
    }
  >;
  setFeedBlogs: (
    userId: string,
    data: Blog[],
    pagination: { hasMore: boolean; nextCursor: string | null }
  ) => void;
  getFeedBlogs: (userId: string) => {
    data: Blog[];
    pagination: { hasMore: boolean; nextCursor: string | null };
    timestamp: number;
  } | null;

  // User blogs
  userBlogs: Record<
    string,
    {
      data: Blog[];
      pagination: { hasMore: boolean; nextCursor: string | null };
      timestamp: number;
    }
  >;
  setUserBlogs: (
    userId: string,
    data: Blog[],
    pagination: { hasMore: boolean; nextCursor: string | null }
  ) => void;
  getUserBlogs: (userId: string) => {
    data: Blog[];
    pagination: { hasMore: boolean; nextCursor: string | null };
    timestamp: number;
  } | null;

  // Following users
  followingUsers: Record<string, { data: FollowingUser[]; timestamp: number }>;
  setFollowingUsers: (userId: string, data: FollowingUser[]) => void;
  getFollowingUsers: (
    userId: string
  ) => { data: FollowingUser[]; timestamp: number } | null;

  // Suggested users
  suggestedUsers: { data: SuggestedUser[]; timestamp: number } | null;
  setSuggestedUsers: (data: SuggestedUser[]) => void;

  // User stats
  userStats: Record<
    string,
    { posts: number; followers: number; following: number; timestamp: number }
  >;
  setUserStats: (
    userId: string,
    stats: { posts: number; followers: number; following: number }
  ) => void;
  getUserStats: (userId: string) => {
    posts: number;
    followers: number;
    following: number;
    timestamp: number;
  } | null;

  // Follow status
  followStatus: Record<string, { following: boolean; timestamp: number }>;
  setFollowStatus: (userId: string, following: boolean) => void;
  getFollowStatus: (
    userId: string
  ) => { following: boolean; timestamp: number } | null;

  // Cache invalidation
  invalidateUserData: (userId: string) => void;
  invalidateFeedBlogs: (userId: string) => void;
  invalidateUserBlogs: (userId: string) => void;
  invalidateFollowingUsers: (userId: string) => void;
  invalidateSuggestedUsers: () => void;
  invalidateUserStats: (userId: string) => void;
  invalidateFollowStatus: (userId: string) => void;
  clearCache: () => void;
}

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User data
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // User profiles
      userProfiles: {},
      setUserProfile: (username, user) =>
        set((state) => ({
          userProfiles: {
            ...state.userProfiles,
            [username]: user,
          },
        })),
      getUserProfile: (username) => get().userProfiles[username] || null,

      // Feed blogs
      feedBlogs: {},
      setFeedBlogs: (userId, data, pagination) =>
        set((state) => ({
          feedBlogs: {
            ...state.feedBlogs,
            [userId]: {
              data,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getFeedBlogs: (userId) => {
        const cached = get().feedBlogs[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // User blogs
      userBlogs: {},
      setUserBlogs: (userId, data, pagination) =>
        set((state) => ({
          userBlogs: {
            ...state.userBlogs,
            [userId]: {
              data,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getUserBlogs: (userId) => {
        const cached = get().userBlogs[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Following users
      followingUsers: {},
      setFollowingUsers: (userId, data) =>
        set((state) => ({
          followingUsers: {
            ...state.followingUsers,
            [userId]: {
              data,
              timestamp: Date.now(),
            },
          },
        })),
      getFollowingUsers: (userId) => {
        const cached = get().followingUsers[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Suggested users
      suggestedUsers: null,
      setSuggestedUsers: (data) =>
        set({
          suggestedUsers: {
            data,
            timestamp: Date.now(),
          },
        }),

      // User stats
      userStats: {},
      setUserStats: (userId, stats) =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            [userId]: {
              ...stats,
              timestamp: Date.now(),
            },
          },
        })),
      getUserStats: (userId) => {
        const cached = get().userStats[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Follow status
      followStatus: {},
      setFollowStatus: (userId, following) =>
        set((state) => ({
          followStatus: {
            ...state.followStatus,
            [userId]: {
              following,
              timestamp: Date.now(),
            },
          },
        })),
      getFollowStatus: (userId) => {
        const cached = get().followStatus[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Cache invalidation
      invalidateUserData: (userId) =>
        set((state) => {
          const { userProfiles, ...rest } = state;
          const newUserProfiles = { ...userProfiles };

          // Find and remove the user profile by userId
          Object.keys(newUserProfiles).forEach((username) => {
            if (newUserProfiles[username]?.id === userId) {
              delete newUserProfiles[username];
            }
          });

          return {
            ...rest,
            userProfiles: newUserProfiles,
          };
        }),
      invalidateFeedBlogs: (userId) =>
        set((state) => {
          const { feedBlogs, ...rest } = state;
          const newFeedBlogs = { ...feedBlogs };
          delete newFeedBlogs[userId];
          return {
            ...rest,
            feedBlogs: newFeedBlogs,
          };
        }),
      invalidateUserBlogs: (userId) =>
        set((state) => {
          const { userBlogs, ...rest } = state;
          const newUserBlogs = { ...userBlogs };
          delete newUserBlogs[userId];
          return {
            ...rest,
            userBlogs: newUserBlogs,
          };
        }),
      invalidateFollowingUsers: (userId) =>
        set((state) => {
          const { followingUsers, ...rest } = state;
          const newFollowingUsers = { ...followingUsers };
          delete newFollowingUsers[userId];
          return {
            ...rest,
            followingUsers: newFollowingUsers,
          };
        }),
      invalidateSuggestedUsers: () =>
        set((state) => ({
          ...state,
          suggestedUsers: null,
        })),
      invalidateUserStats: (userId) =>
        set((state) => {
          const { userStats, ...rest } = state;
          const newUserStats = { ...userStats };
          delete newUserStats[userId];
          return {
            ...rest,
            userStats: newUserStats,
          };
        }),
      invalidateFollowStatus: (userId) =>
        set((state) => {
          const { followStatus, ...rest } = state;
          const newFollowStatus = { ...followStatus };
          delete newFollowStatus[userId];
          return {
            ...rest,
            followStatus: newFollowStatus,
          };
        }),
      clearCache: () =>
        set({
          userProfiles: {},
          feedBlogs: {},
          userBlogs: {},
          followingUsers: {},
          suggestedUsers: null,
          userStats: {},
          followStatus: {},
        }),
    }),
    {
      name: "blog-app-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        userProfiles: state.userProfiles,
        feedBlogs: state.feedBlogs,
        userBlogs: state.userBlogs,
        followingUsers: state.followingUsers,
        suggestedUsers: state.suggestedUsers,
        userStats: state.userStats,
        followStatus: state.followStatus,
      }),
    }
  )
);

export default useStore;
