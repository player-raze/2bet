<script setup lang="ts">
import LiveView from '~/components/sports/LiveView.vue'

useAppSeo({
  title: 'Plataforma 2bet | Aplicativo Premium de Apostas ao Vivo',
  description: 'Acesse a central de apostas ao vivo da Plataforma 2bet Brasil. Placares em tempo real, estatísticas atualizadas e liquidação rápida de bilhetes.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Esportes', path: '/sports/popular' },
    { name: 'Central ao Vivo', path: '/sports/live' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '2Bet Live Sports Hub',
    url: 'https://2bet.com/sports/live',
  },
})
</script>

<template>
  <LiveView />
</template>

