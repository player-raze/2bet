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
      class="installation-guide"
      :aria-labelledby="titleId"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click="($event.target === dialog) && emit('close')"
    >
      <button class="installation-close" type="button" aria-label="Close installation guide" autofocus @click="emit('close')">
        <X :size="22" aria-hidden="true" />
      </button>

      <header class="installation-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#00B7ED" />
          <path d="M9 5L18 20M15 5L6 20M5 15H19" stroke="white" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <h2 :id="titleId">2bet APP Installation Guide</h2>
      </header>

      <video v-if="videoUrl" ref="video" class="installation-video" :src="videoUrl" controls playsinline preload="metadata" aria-label="2bet app installation video" />
      <div v-else class="installation-video installation-video-placeholder" role="img" aria-label="Installation video coming soon">
        <Play :size="28" aria-hidden="true" />
        <span>Installation video coming soon</span>
      </div>

      <section class="installation-step" aria-labelledby="install-step-one">
        <div class="installation-step-summary">
          <span class="installation-step-number">Step 1</span>
          <div>
            <h3 id="install-step-one">Install TestFlight and return to this page.</h3>
            <p>If you have already installed it, proceed to the second step.</p>
          </div>
        </div>
        <a :href="testFlightUrl" target="_blank" rel="noopener noreferrer" class="installation-action">Install TestFlight</a>
      </section>

      <section class="installation-step" aria-labelledby="install-step-two">
        <div class="installation-step-summary">
          <span class="installation-step-number">Step 2</span>
          <div>
            <h3 id="install-step-two">Download 2bet APP</h3>
            <p>Ignore the name; it will become the 2bet APP after downloading.</p>
          </div>
        </div>
        <a v-if="downloadUrl" :href="downloadUrl" target="_blank" rel="noopener noreferrer" class="installation-action">Download 2bet APP</a>
        <button v-else type="button" class="installation-action" disabled :aria-describedby="noticeId">Download 2bet APP</button>
      </section>

      <p :id="noticeId" class="installation-notice">{{ downloadUrl ? 'If the link shows that it has been revoked or is invalid, please click again to download.' : 'The app download link is not available yet.' }}</p>
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
  color: #fff;
  background: #141414;
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
  border: 1px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: #aaa;
  cursor: pointer;
}
.installation-header { display: flex; align-items: center; gap: 10px; padding: 8px 34px 12px 8px; }
.installation-header > svg { flex: 0 0 20px; }
.installation-header h2 { margin: 0; font-size: 16px; font-weight: 700; line-height: 24px; }
.installation-video { display: block; width: 100%; height: 168px; border: 0; background: #000; object-fit: contain; }
.installation-video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: #999;
  font-size: 12px;
  text-align: center;
}
.installation-step { margin-top: 16px; padding: 12px; border-radius: 16px; background: #000; }
.installation-step-summary { display: flex; align-items: flex-start; gap: 8px; }
.installation-step-summary > div { min-width: 0; flex: 1 1 0; }
.installation-step-number {
  flex: 0 0 auto;
  padding: 8px 4px;
  border-radius: 8px;
  color: #00ac4f;
  background: #001509;
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
  color: #fff;
  background: var(--main-color);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}
.installation-action:hover { filter: brightness(1.08); }
.installation-action:disabled { opacity: .6; cursor: not-allowed; }
.installation-action:focus-visible,
.installation-close:focus-visible { outline: 2px solid #fedf00; outline-offset: 2px; }
.installation-notice { margin: 10px 2px 0; color: #777; font-size: 12px; line-height: 18px; text-align: center; }
</style>
