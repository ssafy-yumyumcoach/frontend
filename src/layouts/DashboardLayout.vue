<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Users,
  Trophy,
  User,
  Utensils,
  Menu,
  X
} from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

const router = useRouter()
const route = useRoute()

const isMobileMenuOpen = ref(false)

const menuItems = [
  { id: 'dashboard', path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'meal', path: '/meal-register', label: '식단 기록하기', icon: UtensilsCrossed },
  { id: 'exercise', path: '/exercise-register', label: '운동 기록하기', icon: Dumbbell },
  { id: 'stats', path: '/stats-analysis', label: '통계', icon: TrendingUp },
  { id: 'community', path: '/community', label: '커뮤니티', icon: Users },
  { id: 'challenge', path: '/challenge-list', label: '챌린지', icon: Trophy },
  { id: 'mypage', path: '/mypage', label: '마이페이지', icon: User },
]

// Current Page Title
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem ? currentItem.label : '대시보드'
})

// Date Formatting
const today = new Date()
const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}`

const handleNavigation = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 flex">
    <!-- Sidebar - Desktop -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-zinc-900 border-r border-zinc-800">
      <!-- Logo -->
      <div class="p-6 border-b border-zinc-800">
        <div class="flex items-center gap-3">
          <Utensils class="w-7 h-7 text-emerald-500" />
          <span class="text-2xl text-white">
            냠냠코치
          </span>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 p-4 space-y-1">
        <RouterLink
          v-for="item in menuItems"
          :key="item.id"
          :to="item.path"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
          :class="[
            route.path === item.path
              ? 'bg-emerald-500 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden fixed inset-0 z-50 bg-black/50"
      @click="isMobileMenuOpen = false"
    >
      <aside
        class="w-64 h-full bg-zinc-900 border-r border-zinc-800"
        @click.stop
      >
        <!-- Logo -->
        <div class="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Utensils class="w-7 h-7 text-emerald-500" />
            <span class="text-xl text-white">
              냠냠코치
            </span>
          </div>
          <button
            @click="isMobileMenuOpen = false"
            class="text-zinc-400"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Menu -->
        <nav class="p-4 space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="handleNavigation(item.path)"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
            :class="[
              route.path === item.path
                ? 'bg-emerald-500 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="bg-zinc-900 border-b border-zinc-800 px-6 py-5">
        <div class="flex items-center justify-between">
          <!-- Left: Hamburger & Title -->
          <div class="flex items-center gap-4">
            <button
              @click="isMobileMenuOpen = true"
              class="lg:hidden text-zinc-400 hover:text-white"
            >
              <Menu class="w-6 h-6" />
            </button>
            <h1 class="text-2xl text-white truncate">
              {{ currentPageTitle }}
            </h1>
          </div>

          <!-- Right: User Profile -->
          <div class="flex items-center gap-6">
            <span class="text-zinc-400 hidden sm:block">
              {{ formattedDate }}
            </span>
            <div class="flex items-center gap-3">
              <Avatar class="w-9 h-9">
                <AvatarImage src="" />
                <AvatarFallback class="bg-emerald-500 text-white">
                  홍
                </AvatarFallback>
              </Avatar>
              <span class="text-white hidden sm:block">
                홍길동
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Injection -->
      <main class="flex-1 p-6 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
