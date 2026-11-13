<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import BonusCurrencySelector from './BonusCurrencySelector.vue'

withDefaults(defineProps<{ backTo?: string; currencySelector?: boolean }>(), {
  backTo: '/',
  currencySelector: false,
})

const { selectedCurrency } = useBonusPayments()
const { translate } = useSiteLocale()
</script>

<template>
  <header class="mobile-bonus-header text-white bg-[var(--main-color)]">
    <NuxtLink :to="backTo" class="mobile-bonus-header__back bg-white/15 text-white" :aria-label="translate('Go back')">
      <ChevronLeft :size="20" aria-hidden="true" />
    </NuxtLink>
    <h1>{{ translate('Bonuses') }}</h1>
    <BonusCurrencySelector v-if="currencySelector" v-model="selectedCurrency" />
    <NuxtLink v-else to="/account/language" class="mobile-bonus-header__flag bg-white/15 text-white" :aria-label="translate('Select language')">
      <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%2212%22%20fill%3D%22%2300a651%22%2F%3E%3Cpath%20d%3D%22M12%203%2023%2012%2012%2021%201%2012Z%22%20fill%3D%22%23ffdf00%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%225.7%22%20fill%3D%22%230047ab%22%2F%3E%3Cpath%20d%3D%22M6.7%2010.6q6.1-.7%2010.5%204%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%221.2%22%2F%3E%3C%2Fsvg%3E" alt="Brazil" width="24" height="24">
    </NuxtLink>
  </header>
</template>

<style scoped>
.mobile-bonus-header { display: none; }
@media (max-width: 63.99rem) {
  .mobile-bonus-header {
    position: sticky;
    top: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    align-items: center;
    height: 52px;
    padding: 0 14px;
    background: var(--main-color);
  }
  h1 { margin: 0; text-align: center; font-size: 16px; font-weight: 800; }
  .mobile-bonus-header__back, .mobile-bonus-header__flag {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 50%;
    box-shadow: inset 1px 1px #ffffff4d, inset -1px -1px #ffffff80, inset 2px 2px 4px #00000005, inset -4px -4px 8px #00000005, 0 0 4px #0000000a, 0 4px 8px #00000014;
  }
  img { width: 24px; height: 24px; object-fit: contain; }
}
</style>
