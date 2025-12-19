<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Send, Sparkles, User, Bot, X, MessageCircle } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const isOpen = ref(false);
const messages = ref<Message[]>([
  {
    id: "1",
    role: "assistant",
    content: "안녕하세요! 냠냠코치 AI입니다. 식단이나 운동에 대해 궁금한 점이 있으신가요?",
    timestamp: new Date(),
  },
]);

const userInput = ref("");
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  // Add user message
  const userMsg: Message = {
    id: Date.now().toString(),
    role: "user",
    content: userInput.value,
    timestamp: new Date(),
  };
  messages.value.push(userMsg);
  userInput.value = "";
  scrollToBottom();

  // Simulate AI response
  isTyping.value = true;
  setTimeout(() => {
    isTyping.value = false;
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        "좋은 질문이네요! 현재 식단 기록을 분석해보면 단백질 섭취는 충분하지만, 수분 섭취가 조금 부족해 보입니다. 물을 하루 2L 이상 마시는 것을 목표로 해보시는 건 어떨까요?",
      timestamp: new Date(),
    };
    messages.value.push(aiMsg);
    scrollToBottom();
  }, 1500);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
    <!-- Chat Window -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        class="w-[360px] h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <header class="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles class="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h1 class="text-sm text-white font-semibold">AI 코치</h1>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[10px] text-zinc-400">상담 가능</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" class="w-8 h-8 text-zinc-400 hover:text-white" @click="toggleChat">
            <X class="w-4 h-4" />
          </Button>
        </header>

        <!-- Chat Area -->
        <main ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-zinc-950/50">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex gap-3"
            :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div
                v-if="msg.role === 'assistant'"
                class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
              >
                <Bot class="w-4 h-4 text-emerald-500" />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700"
              >
                <User class="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex flex-col gap-1 max-w-[75%]" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
              <div
                class="px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
                :class="
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                "
              >
                {{ msg.content }}
              </div>
              <span class="text-[10px] text-zinc-500 px-1">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="flex gap-3">
            <div
              class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
            >
              <Bot class="w-4 h-4 text-emerald-500" />
            </div>
            <div
              class="bg-zinc-800 border border-zinc-700 px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </main>

        <!-- Input Area -->
        <footer class="p-3 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
          <form @submit.prevent="sendMessage" class="relative flex items-center gap-2">
            <div class="relative flex-1">
              <input
                v-model="userInput"
                type="text"
                placeholder="궁금한 점을 물어보세요..."
                class="w-full bg-zinc-800 text-white placeholder:text-zinc-500 border border-zinc-700 rounded-full px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <Button
                type="submit"
                size="icon"
                :disabled="!userInput.trim() || isTyping"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send class="w-4 h-4" />
              </Button>
            </div>
          </form>
        </footer>
      </div>
    </transition>

    <!-- Floating Action Button -->
    <button
      @click="toggleChat"
      class="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
    >
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 rotate-90 scale-50"
        enter-to-class="opacity-100 rotate-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 rotate-0 scale-100"
        leave-to-class="opacity-0 -rotate-90 scale-50"
        mode="out-in"
      >
        <X v-if="isOpen" class="w-7 h-7" />
        <Bot v-else class="w-7 h-7 group-hover:animate-bounce" />
      </transition>
    </button>
  </div>
</template>

<style scoped>
/* Scrollbar Customization */
main::-webkit-scrollbar {
  width: 4px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
main::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 2px;
}
main::-webkit-scrollbar-thumb:hover {
  background-color: #52525b;
}
</style>
