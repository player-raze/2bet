<script setup lang="ts">
import { Play, X } from 'lucide-vue-next'

withDefaults(defineProps<{
  downloadUrl?: string
  videoUrl?: string
}>(), { downloadUrl: '', videoUrl: '' })

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const titleId = useId()
const noticeId = useId()
const testFlightUrl = 'https://apps.apple.com/app/testflight/id899247664'
let previousOverflow = ''
let previousFocus: HTMLElement | null = null

onMounted(() => {
  previousOverflow = document.body.style.overflow
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
})

onBeforeUnmount(() => {
  video.value?.pause()
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  previousFocus?.focus({ preventScroll: true })
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="installation-guide bg-[#141414] text-white light:bg-white light:text-[#10261c] border border-transparent light:border-[#d8e2dc] light:shadow-2xl"
      :aria-labelledby="titleId"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click="($event.target === dialog) && emit('close')"
    >
      <button class="installation-close bg-[#aaa] text-white border border-white light:bg-[#edf4f0] light:text-[#2a3c33] light:border-[#d8e2dc]" type="button" aria-label="Close installation guide" autofocus @click="emit('close')">
        <X :size="22" aria-hidden="true" />
      </button>

      <header class="installation-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#00B7ED" />
          <path d="M9 5L18 20M15 5L6 20M5 15H19" stroke="white" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <h2 :id="titleId" class="text-white light:text-[#10261c]">2bet APP Installation Guide</h2>
      </header>

      <video v-if="videoUrl" ref="video" class="installation-video bg-black" :src="videoUrl" controls playsinline preload="metadata" aria-label="2bet app installation video" />
      <div v-else class="installation-video installation-video-placeholder bg-black text-[#999] light:text-[#5d7066]" role="img" aria-label="Installation video coming soon">
        <Play :size="28" aria-hidden="true" />
        <span>Installation video coming soon</span>
      </div>

      <section class="installation-step bg-black light:bg-[#f4f8f5] border border-transparent light:border-[#d8e2dc]" aria-labelledby="install-step-one">
        <div class="installation-step-summary">
          <span class="installation-step-number text-[#00ac4f] bg-[#001509] light:bg-[#eaf5ee] light:text-[#019440] light:border light:border-emerald-500/20">Step 1</span>
          <div>
            <h3 id="install-step-one" class="text-white light:text-[#10261c]">Install TestFlight and return to this page.</h3>
            <p class="text-white/80 light:text-[#5d7066]">If you have already installed it, proceed to the second step.</p>
          </div>
        </div>
        <a :href="testFlightUrl" target="_blank" rel="noopener noreferrer" class="installation-action text-white bg-[var(--main-color)]">Install TestFlight</a>
      </section>

      <section class="installation-step bg-black light:bg-[#f4f8f5] border border-transparent light:border-[#d8e2dc]" aria-labelledby="install-step-two">
        <div class="installation-step-summary">
          <span class="installation-step-number text-[#00ac4f] bg-[#001509] light:bg-[#eaf5ee] light:text-[#019440] light:border light:border-emerald-500/20">Step 2</span>
          <div>
            <h3 id="install-step-two" class="text-white light:text-[#10261c]">Download 2bet APP</h3>
            <p class="text-white/80 light:text-[#5d7066]">Ignore the name; it will become the 2bet APP after downloading.</p>
          </div>
        </div>
        <a v-if="downloadUrl" :href="downloadUrl" target="_blank" rel="noopener noreferrer" class="installation-action text-white bg-[var(--main-color)]">Download 2bet APP</a>
        <button v-else type="button" class="installation-action text-white bg-[var(--main-color)]" disabled :aria-describedby="noticeId">Download 2bet APP</button>
      </section>

      <p :id="noticeId" class="installation-notice text-[#777] light:text-[#5d7066]">{{ downloadUrl ? 'If the link shows that it has been revoked or is invalid, please click again to download.' : 'The app download link is not available yet.' }}</p>
    </dialog>
  </Teleport>
</template>

<style scoped>
.installation-guide {
  position: fixed;
  inset: 0;
  width: min(375px, 100vw);
  max-width: none;
  max-height: calc(100dvh - 16px);
  margin: auto;
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 0;
  border-radius: 24px;
  scrollbar-width: thin;
}
.installation-guide::backdrop { background: rgb(0 0 0 / 75%); }
.installation-close {
  position: absolute;
  top: 6px;
  right: 4px;
  z-index: 1;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
}
.installation-header { display: flex; align-items: center; gap: 10px; padding: 8px 34px 12px 8px; }
.installation-header > svg { flex: 0 0 20px; }
.installation-header h2 { margin: 0; font-size: 16px; font-weight: 700; line-height: 24px; }
.installation-video { display: block; width: 100%; height: 168px; border: 0; object-fit: contain; }
.installation-video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  text-align: center;
}
.installation-step { margin-top: 16px; padding: 12px; border-radius: 16px; }
.installation-step-summary { display: flex; align-items: flex-start; gap: 8px; }
.installation-step-summary > div { min-width: 0; flex: 1 1 0; }
.installation-step-number {
  flex: 0 0 auto;
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  white-space: nowrap;
}
.installation-step h3 { margin: 0; font-size: 12px; font-weight: 700; line-height: 20px; }
.installation-step p { margin: 4px 0 0; font-size: 10px; line-height: 18px; }
.installation-action {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  padding: 10px 8px;
  border: 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}
.installation-action:hover { filter: brightness(1.08); }
.installation-action:disabled { opacity: .6; cursor: not-allowed; }
.installation-action:focus-visible,
.installation-close:focus-visible { outline: 2px solid #fedf00; outline-offset: 2px; }
.installation-notice { margin: 10px 2px 0; font-size: 12px; line-height: 18px; text-align: center; }
</style>
