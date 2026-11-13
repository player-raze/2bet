<script setup lang="ts">
import GameRulesDocument from '~/components/game-rules/GameRulesDocument.vue'
import { basketballRulesHtml } from '~/data/basketball-rules'

useAppSeo({
  title: 'Como apostar em basquete e regras de jogo na 2bet plataforma',
  description: 'Consulte as regras gerais de apostas esportivas na 2bet plataforma. Critérios de aceitação de palpites, limites e liquidação de eventos.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Regras de Jogo', path: '/game-rules' },
    { name: 'Regras de Basquete', path: '/game-rules/basketball' },
  ],
})
</script>

<template>
  <GameRulesDocument :html="basketballRulesHtml" />
</template>
