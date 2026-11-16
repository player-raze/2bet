<script setup lang="ts">
import { formatJackpotAmount } from '~/composables/useJackpotCounter'

const props = defineProps<{ amount: number; provider: string }>()
const characters = computed(() => [...formatJackpotAmount(props.amount)])
</script>

<template>
  <div
    class="jackpot-counter-plate light:bg-[#f0f7f3] light:border-emerald-500/25"
    role="status"
    aria-live="polite"
    :aria-label="`${provider} Jackpot: R$ ${formatJackpotAmount(amount)}`"
  >
    <div class="jackpot-currency-badge light:bg-[#d8eee3] light:text-[#026b34] light:border-emerald-500/35" aria-hidden="true">
      <span>R$</span>
    </div>
    <div class="jackpot-counter-tiles" aria-hidden="true">
      <template v-for="(character, index) in characters" :key="characters.length - index">
        <div v-if="/\d/.test(character)" class="digit-box light:bg-white light:border-emerald-500/20">
          <img :src="`/images/jackpot/${character}.webp`" :alt="character" class="digit-img" width="34" height="45">
        </div>
        <div v-else class="separator-box">
          <img
            :src="character === ',' ? '/images/jackpot/comma.webp' : '/images/jackpot/dot.webp'"
            :alt="character"
            class="separator-img"
            width="4"
            height="15"
          >
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.jackpot-counter-plate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid rgba(1, 148, 64, 0.28);
  border-radius: 12px;
  background: linear-gradient(180deg, #08160e 0%, #000000 100%);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(1, 148, 64, 0.2);
}
.jackpot-currency-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 48px;
  padding: 0 12px;
  border: 1px solid rgba(1, 148, 64, 0.6);
  border-radius: 6px;
  background: linear-gradient(180deg, #023819 0%, #011d0d 100%);
  color: #32d49a;
  font-family: monospace;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 12px rgba(1, 148, 64, 0.3);
}
.jackpot-counter-tiles {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5px;
}
.digit-box {
  display: inline-flex;
  flex-shrink: 0;
  width: 36px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(1, 148, 64, 0.25);
  border-radius: 6px;
  background: linear-gradient(180deg, #132218 0%, #040d07 50%, #09150e 100%);
  box-shadow: inset 0 1px 0 rgba(1, 148, 64, 0.2), 0 3px 6px rgba(0, 0, 0, 0.6);
}
.digit-img {
  display: block;
  width: 28px;
  height: auto;
  max-height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85));
}
.separator-box {
  display: inline-flex;
  flex-shrink: 0;
  width: 9px;
  height: 48px;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
}
.separator-img {
  display: block;
  width: 3px;
  height: auto;
  max-height: 14px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
@media (max-width: 768px) {
  .digit-box { width: 30px; height: 42px; }
  .digit-img { width: 23px; max-height: 32px; }
  .separator-box { width: 7px; height: 42px; }
  .jackpot-currency-badge { height: 42px; padding: 0 9px; font-size: 12px; }
}
@media (max-width: 540px) {
  .digit-box { width: 27px; height: 38px; }
  .digit-img { width: 20px; max-height: 28px; }
  .separator-box { width: 6px; height: 38px; }
  .jackpot-currency-badge { height: 38px; padding: 0 8px; }
}
</style>
