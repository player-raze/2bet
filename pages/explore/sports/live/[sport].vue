<script setup lang="ts">
import { computed } from 'vue'
import LiveView from '~/components/sports/LiveView.vue'

const route = useRoute()
const { translate } = useSiteLocale()
const siteUrl = useSiteUrl()
const sport = computed(() => String(route.params.sport || '').toLowerCase())
const sportName = computed(() => translate(sport.value.charAt(0).toUpperCase() + sport.value.slice(1)))

useAppSeo({
  title: computed(() => formatSeoTitle(`Apostas em ${sportName.value} ao vivo | 2bet Login App`)),
  description: computed(() => formatSeoDescription(`Acompanhe e aposte em jogos de ${sportName.value.toLowerCase()} ao vivo na 2bet login app. Linhas dinâmicas, placares em tempo real e cash out rápido.`)),
  breadcrumbs: computed(() => [
    { name: 'Início', path: '/' },
    { name: 'Esportes', path: '/sports/popular' },
    { name: 'Esportes ao Vivo', path: '/sports/live' },
    { name: sportName.value, path: `/sports/live/${sport.value}` },
  ]),
  schema: computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Apostas ao Vivo em ${sportName.value} - 2bet`,
    url: `${siteUrl.value}/sports/live/${sport.value}`,
    description: `Acompanhe e aposte ao vivo em jogos de ${sportName.value} com odds em tempo real na 2bet Brasil.`,
  })),
})

definePageMeta({
  validate: (route) => ['basketball', 'soccer', 'tennis', 'baseball'].includes(String(route.params.sport).toLowerCase()),
})
</script>

<template>
  <LiveView :sport="sport" />
</template>

