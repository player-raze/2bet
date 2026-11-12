<script setup lang="ts">
import SubpageHeader from '~/components/SubpageHeader.vue'
import { Search } from 'lucide-vue-next'

const searchQuery = ref('')
const { translate } = useSitePreferences()
const currentDate = new Date()
const {
  selectedTimeZone,
  setTimeZone,
  timeZone,
} = useTimeZonePreference()

useAppSeo({
  title: 'Configuração de Fuso Horário e Agenda de Partidas | 2bet',
  description: 'Ajuste o fuso horário na 2bet Brasil para acompanhar partidas esportivas ao vivo e programações de torneios com horários locais precisos.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Minha Conta', path: '/account/me' },
    { name: 'Fuso Horário', path: '/account/timezone' },
  ],
})

const filteredTimeZones = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  if (!query) {
    return timeZoneOptions
  }

  return timeZoneOptions.filter((option) => {
    return [option.city, option.country, option.offset, option.timeZone]
      .some(value => value.toLocaleLowerCase().includes(query))
  })
})
</script>

<template>
  <section class="preference-page timezone-page w-full min-w-0 pb-16 text-white bg-black light:bg-[#f4f8f5] light:text-[#10261c]">
    <SubpageHeader
      title="Time Zone"
      back-to="/account/me"
      class="mb-2 sm:mb-3"
    />

    <div class="px-2.5 sm:px-0">
      <label class="search-box mb-2 flex min-h-[40px] items-center gap-2 rounded-xl px-3 bg-[#151515] border border-white/5 light:bg-white light:border-[#d8e2dc] light:shadow-sm">
        <Search class="h-[18px] w-[18px] shrink-0 text-[#919694]" aria-hidden="true" />
        <span class="sr-only">{{ translate('Search country or city') }}</span>
        <input
          v-model="searchQuery"
          type="search"
          class="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#919694] light:text-[#10261c] light:placeholder:text-[#8c918f]"
          :placeholder="translate('Search country or city')"
          autocomplete="off"
        >
      </label>

      <div class="preference-list overflow-hidden rounded-xl bg-[#141414] border border-white/5 light:bg-white light:border-[#d8e2dc] light:shadow-sm">
        <button
          v-for="option in filteredTimeZones"
          :key="option.timeZone"
          type="button"
          class="preference-row flex w-full items-center justify-between gap-4 px-3 text-left border-b border-[#414141] last:border-b-0 light:border-b-[#eef2f0] hover:bg-white/[0.045] focus-visible:bg-white/[0.045] light:hover:bg-[#f4f8f5] light:focus-visible:bg-[#f4f8f5]"
          :class="{ 'preference-row--selected': timeZone === option.timeZone }"
          :aria-current="timeZone === option.timeZone ? 'true' : undefined"
          @click="setTimeZone(option.timeZone)"
        >
          <span class="min-w-0">
            <span
              class="block truncate text-[14px] leading-[18px]"
              :class="timeZone === option.timeZone ? 'font-bold text-[#20c997]' : 'text-[#f0f1f1] light:text-[#10261c]'"
            >
              {{ option.city }}
            </span>
            <span class="block truncate text-[12px] leading-[16px] text-[#8c918f]">
              {{ translate(option.country) }}
            </span>
          </span>
          <span class="shrink-0 text-right">
            <span
              class="block text-[14px] leading-[18px]"
              :class="timeZone === option.timeZone ? 'font-bold text-[#20c997]' : 'text-[#eceeed] light:text-[#10261c]'"
            >
              {{ option.offset }}
            </span>
            <span class="block text-[12px] leading-[16px] text-[#8c918f]">
              {{ formatTimeZoneDate(option.timeZone, currentDate) }}
            </span>
          </span>
        </button>

        <p v-if="filteredTimeZones.length === 0" class="px-4 py-8 text-center text-[14px] text-[#8c918f]">
          {{ translate('No time zones found.') }}
        </p>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">
      {{ translate('Selected time zone:') }} {{ selectedTimeZone.city }}, {{ selectedTimeZone.offset }}
    </p>
  </section>
</template>

<style scoped>
.preference-page {
  min-height: calc(100vh - var(--header-height));
}

.search-box:focus-within {
  border-color: rgba(32, 201, 151, 0.42);
  box-shadow: 0 0 0 2px rgba(32, 201, 151, 0.08);
}

.preference-row {
  min-height: 60px;
  transition: background-color 140ms ease;
}

.preference-row:last-of-type {
  border-bottom: 0;
}

.preference-row:hover,
.preference-row:focus-visible {
  outline: none;
}
</style>

