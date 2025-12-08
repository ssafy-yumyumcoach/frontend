<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Utensils } from 'lucide-vue-next'
// import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import ImageWithFallback from '@/components/figma/ImageWithFallback.vue'

const router = useRouter()
// const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  if (isLogin.value) {
    console.log('로그인:', { email: email.value, password: password.value })
    // await authStore.login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } else {
    console.log('회원가입:', { name: name.value, email: email.value, password: password.value })
    // await authStore.register({ name: name.value, email: email.value, password: password.value })
    router.push('/onboarding')
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex">
    <!-- Left side - Brand & Image -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
      <div class="absolute inset-0 bg-black/20"></div>
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc2MzEzNTQ0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        alt="Healthy food"
        class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
      />
      
      <div class="relative z-10 flex flex-col justify-center px-16 text-white h-full">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
            <Utensils class="w-5 h-5" />
            <span class="text-sm">건강한 식단 관리</span>
          </div>
          
          <div class="space-y-4">
            <h1 class="text-6xl tracking-tight">
              냠냠코치
            </h1>
            <p class="text-2xl text-white/90">
              AI로 식단을 분석하고<br />
              건강 루틴을 관리해요
            </p>
          </div>

          <div class="pt-8 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">AI 기반 영양 분석으로 정확한 칼로리와 영양소를 추적해요</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">개인 맞춤형 식단 추천으로 건강한 식습관을 만들어요</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <span>✓</span>
              </div>
              <div>
                <p class="text-white/90">운동 루틴과 연동하여 종합적인 건강 관리를 제공해요</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login/Signup Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <Utensils class="w-6 h-6 text-emerald-500" />
          <span class="text-2xl text-white">냠냠코치</span>
        </div>

        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-4xl text-white">{{ isLogin ? '로그인' : '회원가입' }}</h1>
          <p class="text-zinc-400">
            {{ isLogin ? '계정에 로그인하세요' : '새로운 계정을 만드세요' }}
          </p>
        </div>

        <!-- Form -->
        <form @submit="handleSubmit" class="space-y-5">
          <div v-if="!isLogin" class="space-y-2">
            <Label for="name" class="text-zinc-300">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              v-model="name"
              class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700"
              :required="!isLogin"
            />
          </div>

          <div class="space-y-2">
            <Label for="email" class="text-zinc-300">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              v-model="email"
              class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700"
              required
            />
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-zinc-300">비밀번호</Label>
              <a v-if="isLogin" href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">
                비밀번호 찾기
              </a>
            </div>
            <div class="relative">
              <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="password"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 pr-12"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <component :is="showPassword ? EyeOff : Eye" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div v-if="!isLogin" class="space-y-2">
            <Label for="confirmPassword" class="text-zinc-300">비밀번호 확인</Label>
            <div class="relative">
              <Input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="confirmPassword"
                class="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 pr-12"
                :required="!isLogin"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <component :is="showConfirmPassword ? EyeOff : Eye" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            class="w-full h-12 bg-white text-black hover:bg-zinc-200"
          >
            {{ isLogin ? '로그인' : '회원가입' }}
          </Button>
        </form>

        <!-- Toggle between login/signup -->
        <div class="text-center">
          <p v-if="isLogin" class="text-zinc-400">
            아직 가입 안하셨나요?
            <button
              @click="isLogin = false"
              class="text-white hover:underline"
            >
              회원가입
            </button>
          </p>
          <p v-else class="text-zinc-400">
            이미 계정이 있으신가요?
            <button
              @click="isLogin = true"
              class="text-white hover:underline"
            >
              로그인
            </button>
          </p>
        </div>

        <div v-if="isLogin" class="text-center text-sm text-zinc-500">
          계속 진행하면
          <a href="#" class="text-zinc-400 hover:text-white underline">
            서비스 약관
          </a>
          및
          <a href="#" class="text-zinc-400 hover:text-white underline">
            개인정보 처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  </div>
</template>
