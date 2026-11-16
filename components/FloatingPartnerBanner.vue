<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { buildBybetRedirectUrl } from '~/utils/sportsRedirect'

const { bybetRedirectUrl: rawRedirectUrl, bybetRedirectCode } = useRuntimeConfig().public
const bybetRedirectUrl = buildBybetRedirectUrl('login', rawRedirectUrl, bybetRedirectCode)
const visible = useState('floating-partner-banner-visible', () => true)
</script>

<template>
  <aside v-if="visible" class="floating-partner-banner" aria-label="Programa de parceiros 2bet">
    <a
      :href="bybetRedirectUrl"
      target="_blank"
      rel="nofollow noopener noreferrer"
      class="floating-partner-banner__link"
      aria-label="Seja Parceiro Agora — 2bet"
    >
      <img
        src="/images/affiliate/partner-floating.webp"
        alt="Seja Parceiro Agora — 2bet"
        width="418"
        height="627"
        decoding="async"
      >
    </a>
    <!-- <button type="button" class="floating-partner-banner__close" aria-label="Close partner banner" @click="visible = false">
      <X :size="14" aria-hidden="true" />
    </button> -->
  </aside>
</template>

<style scoped>
.floating-partner-banner {
  position: fixed;
  z-index: 42;
  right: max(12px, env(safe-area-inset-left));
  bottom: max(12px, env(safe-area-inset-bottom));
  width: 152px;
  max-width: 28vw;
}
.floating-partner-banner__link { display: block; border-radius: 50%; }
.floating-partner-banner__link img { display: block; width: 100%; height: auto; }
.floating-partner-banner__close {
  position: absolute;
  top: 12%;
  right: 0;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 1px solid #ffffff59;
  border-radius: 50%;
  color: #fff;
  background: #121212e6;
  cursor: pointer;
}
.floating-partner-banner__close:hover { background: #333; }
.floating-partner-banner :is(a, button):focus-visible { outline: 2px solid #f9c600; outline-offset: 3px; }
@media (max-width: 1023px) {
  .floating-partner-banner { right: max(8px, env(safe-area-inset-left)); bottom: calc(78px + env(safe-area-inset-bottom)); width: 104px; max-width: 30vw; }
  .floating-partner-banner__close { width: 32px; height: 32px; }
}
</style>
