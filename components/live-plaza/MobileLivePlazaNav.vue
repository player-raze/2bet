<script setup lang="ts">
import { Compass, Mic, GraduationCap, WalletCards } from 'lucide-vue-next'

defineEmits<{ back: [] }>()
const route = useRoute()
const items = [
  { label: 'Plaza', to: '/live-plaza/home', icon: Compass },
  { label: 'Streamer', to: '/live-plaza/streamer', icon: Mic },
  { label: 'Predict', to: '/live-plaza/expert-predictions', icon: GraduationCap },
  { label: 'Funds', to: '/live-plaza/funds', icon: WalletCards },
]
const isActive = (item: typeof items[number]): boolean => {
  const path = route.path.replace(/\/$/, '')
  if (item.label === 'Predict') return path.endsWith('/expert-predictions') || path.endsWith('/experts')
  if (item.label === 'Streamer') return path.includes('/streamer') || path.endsWith('/all-streamers')
  return path === item.to
}
</script>

<template>
  <div class="live-plaza-nav-row">
    <NuxtLink
      v-for="item in items"
      :key="item.label"
      :to="item.to"
      class="live-plaza-nav-item text-[#959799] light:text-[#5d7066] [&[aria-current='page']]:!text-[#1fa779]"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <component :is="item.icon" :size="21" :stroke-width="2.4" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </NuxtLink>
    <button type="button" class="live-plaza-nav-back bg-[var(--main-color)] text-white" aria-label="Back to main navigation" @click="$emit('back')">
      <span class="bg-[#101010] text-[#f4f7f5] light:bg-white light:text-[#10261c] light:border light:border-[#d8e2dc]">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="11" fill="currentColor" />
          <path d="M13 8 8 13l5 5M8 13h10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped>
.live-plaza-nav-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 60px; height: 58px; align-items: stretch; }
.live-plaza-nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; font-size: 11px; line-height: 1; }
.live-plaza-nav-back { display: grid; place-items: center; border-radius: 32px 32px 0 32px; }
.live-plaza-nav-back span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; }
</style>
