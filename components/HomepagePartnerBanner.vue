<script setup lang="ts">
import { buildBybetRedirectUrl } from '~/utils/sportsRedirect'

const { bybetRedirectUrl: rawRedirectUrl, bybetRedirectCode } = useRuntimeConfig().public
const bybetRedirectUrl = buildBybetRedirectUrl('login', rawRedirectUrl, bybetRedirectCode)
const banner = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

let observer: IntersectionObserver | undefined

const syncVideoPlayback = (isInView: boolean) => {
  if (!video.value) return

  if (!window.matchMedia('(max-width: 767px)').matches) {
    video.value.pause()
    return
  }

  if (isInView) {
    void video.value.play().catch(() => {
      // Autoplay can still be blocked by the browser; the video remains muted.
    })
  } else {
    video.value.pause()
  }
}

onMounted(() => {
  if (!banner.value || !video.value) return

  video.value.muted = true

  observer = new IntersectionObserver(([entry]) => {
    syncVideoPlayback(entry?.isIntersecting === true)
  }, { threshold: 0.01 })

  observer.observe(banner.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = undefined
})
</script>

<template>
  <a
    ref="banner"
    :href="bybetRedirectUrl"
    target="_blank"
    rel="nofollow noopener noreferrer"
    class="homepage-partner-banner"
    aria-label="Seja um Parceiro Promocional da 2BET"
  >
    <picture class="homepage-partner-banner__image">
      <source media="(min-width: 1200px)" srcset="/images/affiliate/partner-promotional-desktop.webp" width="1020" height="80">
      <img
        src="/images/affiliate/partner-promotional-desktop.webp"
        alt="Seja um Parceiro Promocional da 2BET"
        width="120"
        height="80"
        loading="lazy"
        decoding="async"
      >
    </picture>
    <video
      ref="video"
      class="homepage-partner-banner__video"
      src="/images/affiliate/partner-promotional-mobile.mp4"
      poster="/images/affiliate/partner-promotional-desktop.webp"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      aria-hidden="true"
    />
  </a>
</template>

<style scoped>
.homepage-partner-banner { display: block; flex: 1 1 0; min-width: 0; max-width: 1020px; border-radius: 6px; }
.homepage-partner-banner__image { display: block; }
.homepage-partner-banner img { display: block; width: 100%; height: auto; aspect-ratio: 1020 / 80; object-fit: contain; }
.homepage-partner-banner__video { display: none; width: 100%; height: auto; }
.homepage-partner-banner:focus-visible { outline: 2px solid #f9c600; outline-offset: 3px; }
@media (max-width: 1199px) {
  .homepage-partner-banner { flex: 0 0 120px; width: 120px; max-width: 120px; }
  .homepage-partner-banner img { aspect-ratio: 120 / 80; }
}
@media (max-width: 767px) {
  .homepage-partner-banner { width: 100%; max-width: 120px; justify-self: end; }
  .homepage-partner-banner .homepage-partner-banner__image { display: none; }
  .homepage-partner-banner__video { display: block; aspect-ratio: 120 / 80; object-fit: cover; }
}
</style>
