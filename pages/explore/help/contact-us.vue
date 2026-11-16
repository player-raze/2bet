<script setup lang="ts">
const siteUrl = useSiteUrl()

useAppSeo({
  title: 'Fale Conosco — Atendimento ao Cliente e Chat ao Vivo | 2bet',
  description: 'Entre em contato com a equipe de suporte da 2bet Brasil. Canais de atendimento disponíveis 24 horas para garantir assistência ágil e segura.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Ajuda', path: '/help/contact-us' },
    { name: 'Fale Conosco', path: '/help/contact-us' },
  ],
  schema: computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact 2Bet Support',
    url: `${siteUrl.value}/help/contact-us`,
  })),
})
</script>

<template>
  <ComingSoonFallback :disable-seo="true" />
</template>
