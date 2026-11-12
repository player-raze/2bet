<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import SubpageHeader from '~/components/SubpageHeader.vue'
import AppInstallationGuide from '~/components/download/AppInstallationGuide.vue'

useAppSeo({
  title: 'Aplicativo Oficial — Guia de Download e Instalação | 2bet',
  description: 'Conheça o aplicativo 2bet e acompanhe as instruções de download e instalação no celular.',
  keywords: '2bet app, baixar 2bet, instalação 2bet, app de apostas, cassino mobile',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Baixar Aplicativo', path: '/download-app' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '2bet Mobile App',
    operatingSystem: 'Android, iOS',
    applicationCategory: 'GameApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  },
})

const showInstallationGuide = ref(false)
const { bybetRedirectUrl, bybetRedirectCode } = useRuntimeConfig().public
const appDownloadUrl = `${bybetRedirectUrl}/downloadApp?p=${bybetRedirectCode}`
</script>

<template>
  <div class="download-app-page max-w-4xl mx-auto pb-16 text-white light:text-[#10261c]">
    <SubpageHeader title="Download APP" back-to="/account/me" class="download-app-header mb-2.5 sm:mb-3" />

    <div class="download-content">
      <section class="app-card bg-[#141414] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm" aria-label="2bet app download">
        <img
          src="/images/app/league-player.webp"
          alt="Football player in a green kit with LEAGUE lettering"
          class="download-player"
          width="960"
          height="960"
          fetchpriority="high"
          decoding="async"
        >

        <button
          type="button"
          class="native-app-row bg-[#242424] text-white hover:bg-[#292929] light:bg-[#f4f8f5] light:text-[#10261c] light:border light:border-[#d8e2dc] light:shadow-xs"
          aria-haspopup="dialog"
          :aria-expanded="showInstallationGuide"
          @click="showInstallationGuide = true"
        >
          <span class="native-app-icon" aria-hidden="true">
            <img src="/icons/2bet-square.webp" alt="" width="36" height="36">
            <span class="text-[#08743b] bg-white">Native</span>
          </span>
          <span class="native-app-copy">
            <strong class="text-white light:text-[#10261c]">Native APP</strong>
            <span class="text-[#999] light:text-[#5d7066]">Standard App</span>
          </span>
          <span class="native-app-arrow" aria-hidden="true"><ChevronRight :size="18" /></span>
        </button>
      </section>
    </div>

    <AppInstallationGuide
      v-if="showInstallationGuide"
      :download-url="appDownloadUrl"
      video-url="https://bm-fluid-assets.bfdoes03.com/download-app/vd011/video/en_US/bd11-tutorial.mp4?version=release-5.46.3#t=0.1"
      @close="showInstallationGuide = false"
    />
  </div>
</template>

<style scoped>
.download-app-page { opacity: 1 !important; transform: none !important; }
.download-content { padding: 0 24px; }
.app-card {
  min-width: 0;
  margin-bottom: 20px;
  padding: 24px 32px 32px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 5%);
  border-radius: 22px;
}
.download-player {
  display: block;
  width: min(440px, 100%);
  height: auto;
  margin: 0 auto 32px;
  object-fit: contain;
  user-select: none;
}
.native-app-row {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 0;
  border-radius: 16px;
  text-align: left;
  cursor: pointer;
}
.native-app-row:focus-visible { outline: 2px solid #48daa6; outline-offset: 3px; }
.native-app-icon { position: relative; width: 36px; height: 36px; flex: 0 0 36px; }
.native-app-icon img { display: block; width: 36px; height: 36px; border-radius: 8px; }
.native-app-icon > span {
  position: absolute;
  bottom: 2px;
  left: 2px;
  padding: 0 2px;
  border-radius: 3px;
  font-size: 4px;
  font-weight: 700;
  line-height: 6px;
}
.native-app-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; }
.native-app-copy strong { font-size: 16px; font-weight: 700; line-height: 20px; }
.native-app-copy > span { font-size: 12px; line-height: 16px; }
.native-app-arrow {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border: 1px solid var(--main-color);
  border-radius: 50%;
  color: var(--main-color);
}

@media (max-width: 63.99rem) {
  .download-app-page { position: relative; isolation: isolate; max-width: none; padding-bottom: 0; }
  .download-app-page::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0 0 auto;
    height: 70px;
    border-radius: 0 0 16px 16px;
    background: var(--main-color);
    pointer-events: none;
  }
  .download-app-header { min-height: 44px; height: 44px; margin: 0; padding-inline: 6px; box-shadow: none; }
  .download-app-header :deep(.subpage-header__title) { font-size: 16px; }
  .download-app-header :deep(.subpage-header__back-btn) { width: 30px; height: 30px; }
  .download-content { padding: 0 1px; }
  .app-card {
    min-height: calc(100dvh - 44px);
    margin: 0;
    padding: 0 16px 24px;
    border: 0;
    border-radius: 14px;
  }
  .download-player { width: min(454px, 100%); margin: 34px auto 54px; }
}
</style>
