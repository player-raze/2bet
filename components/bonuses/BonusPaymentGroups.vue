<script setup lang="ts">
import { BONUS_CURRENCIES } from '~/data/bonus-currencies'
import { PROMOTIONS } from '~/data/promotions'
import { filterBonusesByPayment, getUnassignedBonuses } from '~/utils/bonus-payments'

const { selectedCurrency, selectedCurrencyLabel, filterPromotions } = useBonusPayments()
const currencies = computed(() => BONUS_CURRENCIES.filter(currency => currency.code !== 'all'))
const groups = computed(() => currencies.value.map(currency => ({
  ...currency,
  items: filterBonusesByPayment(PROMOTIONS, currency.code),
})))
const unassigned = computed(() => getUnassignedBonuses(PROMOTIONS))
const visibleCount = computed(() => filterPromotions(PROMOTIONS).length)
</script>

<template>
  <div class="bonus-payment-groups" />
</template>

