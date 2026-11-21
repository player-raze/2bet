<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { normalizeGoogleAnalyticsId, normalizeGoogleTagId } from '~/utils/googleTracking'

const LightModeTheme = defineAsyncComponent(() => import('~/components/LightModeTheme.vue'))
const { locale, restoreLocale } = useSiteLocale()
const { restoreTimeZone } = useTimeZonePreference()
const runtimeConfig = useRuntimeConfig()
const googleSiteVerification = computed(() =>
  String(runtimeConfig.public.googleSiteVerification || '').trim().replace(/^['"]+|['"]+$/g, ''),
)
const googleAnalyticsId = computed(() =>
  normalizeGoogleAnalyticsId(runtimeConfig.public.googleAnalyticsId),
)
const googleTagId = computed(() =>
  normalizeGoogleTagId(runtimeConfig.public.googleTagId),
)
const {
  applyTheme,
  effectiveTheme,
  themePreference,
} = useSiteTheme()
const { isLoading, loadingLabel, checkAssetsAndDismiss } = useByBetLoader()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
    'data-theme': effectiveTheme.value,
    'data-theme-preference': themePreference.value,
  },
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover',
    },
    {
      name: 'theme-color',
      content: effectiveTheme.value === 'light' ? '#eef5f1' : '#080D0B',
    },
    ...(googleSiteVerification.value
      ? [
          {
            key: 'google-site-verification',
            name: 'google-site-verification',
            content: googleSiteVerification.value,
          },
        ]
      : []),
  ],
  script: [
    ...(googleTagId.value
      ? [
          {
            key: 'google-tag-gtm',
            async: true,
            src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(googleTagId.value)}`,
          },
          {
            key: 'google-tag-init',
            innerHTML: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());",
          },
        ]
      : []),
    ...(googleAnalyticsId.value
      ? [
          {
            key: 'google-analytics-gtag',
            async: true,
            src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId.value)}`,
          },
          {
            key: 'google-analytics-init',
            innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",${JSON.stringify(googleAnalyticsId.value)});`,
          },
        ]
      : []),
  ],
}))

let teardownDisableZoom: (() => void) | undefined

onMounted(() => {
  try {
    restoreLocale()
    restoreTimeZone()
    applyTheme()
  } finally {
    checkAssetsAndDismiss()
    teardownDisableZoom = setupDisableZoom()
  }
})

onBeforeUnmount(() => {
  teardownDisableZoom?.()
  teardownDisableZoom = undefined
})

const nuxtApp = useNuxtApp()
nuxtApp.hook('page:finish', () => {
  nextTick(() => {
    checkAssetsAndDismiss(100, 1500)
  })
})
</script>

<template>
  <LightModeTheme v-if="effectiveTheme === 'light'" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <Transition name="fade">
    <ByBetSpinner
      v-if="isLoading"
      fullscreen
      size="lg"
      :label="loadingLabel"
    />
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
