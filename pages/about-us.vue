<script setup lang="ts">
import SubpageHeader from '~/components/SubpageHeader.vue'

useAppSeo({
  title: 'Sobre a Plataforma Oficial de Apostas e Cassino | 2bet',
  description: 'Conheça a 2bet: nossa reputação, variedade de jogos, depósitos, saques e atendimento ao cliente disponível 24 horas.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Sobre Nós', path: '/about-us' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Sobre a 2bet',
    url: 'https://2bet.com/about-us',
    description: 'Conheça a 2bet: confiança, variedade de jogos, depósitos, saques e suporte 24/7.',
  },
})
</script>

<template>
  <div class="about-us-page">
    <SubpageHeader title="About Us" back-to="/account/me" class="about-us-header" />

    <article class="about-us-card" aria-label="About Us">
      <h2>About Us</h2>
      <p>
        2bet is committed to meeting the demands of entertainment consumers and sports betting enthusiasts worldwide. With integrity, reliability, and exceptional service at the core of our principles, we’re here to serve you.<br>
        Good luck from 2bet!
      </p>

      <h2>Trusted Reputation</h2>
      <p>
        At 2bet, trust and service are our hallmarks. We stand by our reputation as the best in the industry, providing pragmatic and professional brand services. So, choosing 2bet guarantees your satisfaction.
      </p>

      <h2>Game Variety</h2>
      <p>
        2bet offers a wide range of sports betting options, including European odds, Hong Kong odds, Malay odds, Indonesian odds, and more.<br>
        In-Play: Bet live 24/7. For most sports, we provide over 30 markets per event, including options like corners, yellow cards, and free kicks.<br>
        Casino: Our platform features live casino games, slots, lotteries, poker, horse racing, and more, giving you the full gaming experience.
      </p>

      <h2>Deposits &amp; Withdrawals</h2>
      <p>
        Deposit: Support deposits via USDT and other major cryptocurrencies for fast, secure, and reliable transactions.<br>
        Withdrawal: Automatically reviewed and processed on time with a transparent process and fast payouts.<br>
        Note: Visit Deposit or Withdrawal page for more payment methods and detailed instructions.
      </p>

      <h2>Customer Support</h2>
      <p>2bet offers 24/7 customer support via phone and Gmail, ensuring full support whenever you need it.</p>
      <NuxtLink to="/egames/customer-service" class="about-us-contact">Contact CS</NuxtLink>

      <h2 class="about-us-contact-title">About Us</h2>
      <p class="about-us-email">Email:<br><a href="mailto:2bet.kf@2bet.la">2bet.kf@2bet.la</a></p>
    </article>
  </div>
</template>

<style scoped>
.about-us-page {
  min-width: 0;
  color: #f4f4f4;
  opacity: 1 !important;
  transform: none !important;
}

.about-us-header { margin-bottom: 8px; }

.about-us-card {
  padding: 16px;
  border-radius: 12px;
  background: #141414;
  font-size: 14px;
  line-height: 21px;
  overflow-wrap: break-word;
}

.about-us-card h2 {
  display: flex;
  min-height: 44px;
  align-items: center;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  color: #fff;
  background: #000;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
}

.about-us-card p { margin: 20px 0; }

.about-us-contact {
  display: flex;
  width: min(325px, 100%);
  min-height: 54px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 12px;
  color: #fff;
  background: var(--main-color);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.about-us-contact:hover { filter: brightness(1.08); }
.about-us-card a:focus-visible { outline: 2px solid #48daa6; outline-offset: 3px; }
.about-us-card .about-us-contact-title { margin-top: 36px; }
.about-us-card .about-us-email { margin: 30px 16px 20px; line-height: 18px; }

@media (max-width: 63.99rem) {
  .about-us-page { position: relative; isolation: isolate; }
  .about-us-page::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0 0 auto;
    height: 76px;
    border-radius: 0 0 16px 16px;
    background: var(--main-color);
    pointer-events: none;
  }
  .about-us-header { margin: 0; }
  .about-us-header :deep(.subpage-header__title) { font-size: 16px; }
  .about-us-header :deep(.subpage-header__back-btn) { width: 30px; height: 30px; }
  .about-us-card { margin: 1px 7px 0; border-radius: 12px; }
}
</style>
