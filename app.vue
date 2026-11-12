<script setup lang="ts">
const { locale, restoreLocale } = useSiteLocale()
const { restoreTimeZone } = useTimeZonePreference()
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
