import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import MealRegisterView from '@/views/MealRegisterView.vue'
import ExerciseRegisterView from '@/views/ExerciseRegisterView.vue'
import StatsAnalysisView from '@/views/StatsAnalysisView.vue'
import CommunityView from '@/views/CommunityView.vue'
import ChallengeListView from '@/views/ChallengeListView.vue'
import ChallengeDetailView from '@/views/ChallengeDetailView.vue'
import MyPageView from '@/views/MyPageView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
// AuthStore removed
// import { useAuthStore } from '../stores/authStore'
// import { storeToRefs } from 'pinia'
import LoginView from '../views/LoginView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: '/meal-register',
          name: 'meal-register',
          component: MealRegisterView
        },
        {
          path: '/exercise-register',
          name: 'exercise-register',
          component: ExerciseRegisterView
        },
        {
          path: '/stats-analysis',
          name: 'stats-analysis',
          component: StatsAnalysisView
        },
        {
          path: '/community',
          name: 'community',
          component: CommunityView
        },
        {
          path: '/challenge-list',
          name: 'challenge-list',
          component: ChallengeListView
        },
        {
          path: '/challenge/:id',
          name: 'challenge-detail',
          component: ChallengeDetailView
        },
        {
          path: '/mypage',
          name: 'mypage',
          component: MyPageView
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true }
    }
  ]
})

// Auth guard removed as per request
// router.beforeEach((to, _from, next) => {
//   const authStore = useAuthStore()
//   const { isLoggedIn } = storeToRefs(authStore)
// 
//   if (to.meta.requiresAuth && !isLoggedIn.value) {
//     next('/login')
//   } else if (to.path === '/login' && isLoggedIn.value) {
//     next('/')
//   } else {
//     next()
//   }
// })

export default router
