<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800', props.class)"
  >
    <slot />
  </div>
</template>
