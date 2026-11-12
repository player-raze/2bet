<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

const { closeComments } = useCommentPanel()
const { translate } = useSiteLocale()

useAppSeo({
  title: 'Central de Ajuda e Suporte ao Cliente 24 Horas | 2bet',
  description: 'Atendimento rápido 24 horas por dia na 2bet Brasil. Esclareça dúvidas sobre depósitos, saques, bônus e regras de jogos via chat ao vivo.',
  keywords: 'suporte 2bet, atendimento ao cliente 2bet, ajuda 2bet, chat ao vivo',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Ajuda', path: '/help/contact-us' },
    { name: 'Atendimento ao Cliente', path: '/egames/customer-service' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Suporte ao Cliente 2bet',
    url: 'https://2bet.com/egames/customer-service',
  },
})

onMounted(() => {
  closeComments()
})
</script>

<template>
  <div class="customer-service-page w-full min-w-0 pb-16 bg-black text-white light:text-[#10261c] light:bg-[#f4f8f5]">
    <!-- Reusable Top SEO Header Bar -->
    <SeoHeader
      sticky
      title="24/7 Services"
      meta-title="Suporte ao Cliente 24/7 e Central de Ajuda Online | 2bet"
      description="Fale com o suporte ao cliente 24/7 da 2bet para ajuda rápida com depósitos, saques, bônus e verificação de conta. Atendimento ao vivo."
      back-to="/account/me"
    />

    <!-- Welcome Greeting Card -->
    <div class="welcome-card flex items-center gap-1 rounded-lg bg-[#141414] light:bg-white light:border light:border-[#d8e2dc] p-1 sm:p-2 mb-2 shadow-sm">
      <div class="logo-box h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--main-color)] p-1 flex items-center justify-center shadow-sm">
        <img
          src="/icons/2bet-square.webp"
          alt="2Bet"
          class="h-full w-full object-contain"
        >
      </div>
      <div class="welcome-info flex flex-col justify-center">
        <h2 class="text-[16px] font-bold leading-tight text-white light:text-[#10261c]">
          {{ translate('Hi, Dear Customer') }}
        </h2>
        <p class="text-[12px] text-[#7a807d] light:text-[#5d7066] mt-1">
          {{ translate('Welcome to Customer Service Center') }}
        </p>
      </div>
    </div>

    <!-- Service Options Card -->
    <div class="services-card px-0.5 rounded-md bg-[#141414] light:bg-white light:border light:border-[#d8e2dc] overflow-hidden shadow-sm" :aria-label="translate('Customer service channels')">
      <!-- 24/7 Services 1 -->
      <NuxtLink
        to="/egames/customer-service/1"
        class="service-row flex w-full items-center justify-between p-2 text-left transition-colors  group cursor-pointer "
      >
        <div class="flex items-center gap-3">
          <div class="p-[1px] rounded-md shrink-0 bg-[var(--main-color)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="Aæçå½©è²icon"><rect width="32" height="32" rx="8" class="fill-primary"></rect><path id="Vector" d="M16.0054 4C10.1217 4 5.33203 8.99722 5.33203 15.1538C5.33203 18.7518 6.97306 22.0833 9.74812 24.1888L8.1071 26.9872C7.96034 27.2271 7.98702 27.5469 8.17381 27.7601C8.29388 27.9067 8.48067 28 8.65411 28C8.73416 28 8.81421 27.9867 8.89426 27.9467L13.3104 25.9478C14.1909 26.1877 15.0981 26.3076 15.992 26.3076C21.8757 26.3076 26.6654 21.3104 26.6654 15.1538C26.6654 8.99722 21.889 4 16.0054 4ZM20.5549 18.5119C20.5149 18.6185 19.4342 21.0705 16.3523 21.0705C13.0168 21.0705 12.163 18.5652 12.1229 18.4586C11.9895 18.0455 12.2163 17.6058 12.6433 17.4725C13.0702 17.3393 13.5238 17.5658 13.6572 17.9789C13.7106 18.1388 14.271 19.5114 16.3523 19.5114C18.4336 19.5114 19.0606 17.9389 19.0606 17.9256C19.2341 17.5258 19.701 17.3393 20.1146 17.4992C20.5282 17.6591 20.7283 18.1255 20.5549 18.5253V18.5119Z" fill="white"></path></g></svg>
          </div>
          
          <span class="text-[13px] sm:text-[14px] font-medium text-white light:text-[#10261c] transition-colors">
            {{ translate('24/7 Services 1') }}
          </span>
        </div>
        <ChevronRight class="h-4 w-4 text-[#7a807d] light:text-[#5d7066] transition-colors shrink-0" />
      </NuxtLink>

      <!-- Divider -->
      <div class="divider h-px bg-white/30 light:bg-[#eef2f0] mx-1 mb-3" />

    </div>
  </div>
</template>

<style scoped>
.customer-service-page {
  max-width: 100%;
}

.service-row {
  user-select: none;
}

@media (max-width: 63.99rem) {
  .customer-service-page {
    position: relative;
    isolation: isolate;
    min-height: 100dvh;
    padding: 0 5px calc(74px + env(safe-area-inset-bottom));
  }

  .customer-service-page::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0 0 auto;
    height: 72px;
    border-radius: 0 0 16px 16px;
    background: var(--main-color);
    pointer-events: none;
  }

  .customer-service-page :deep(.seo-header-sticky-wrapper) {
    position: relative;
    top: 0;
    z-index: auto;
    height: 46px;
    margin: 0;
    padding: 0;
    border-radius: 0;
  }

  .customer-service-page :deep(.seo-header) {
    justify-content: center;
    min-height: 40px;
    height: 40px;
    padding: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .customer-service-page :deep(.seo-header button) { display: none; }
  .customer-service-page :deep(.seo-header h1) {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    letter-spacing: 0;
    text-align: center;
  }

  .welcome-card {
    height: 78px;
    gap: 8px;
    margin: 0 0 8px;
    padding: 12px;
    border-radius: 12px;
    box-shadow: none;
  }

  .logo-box {
    width: 54px;
    height: 54px;
    padding: 0;
    border-radius: 12px;
    box-shadow: none;
  }

  .welcome-info { min-width: 0; }
  .welcome-info h2 { font-size: 16px; font-weight: 700; line-height: 20px; }
  .welcome-info p { margin: 0; font-size: 12px; line-height: 16px; }

  .services-card {
    height: 56px;
    padding: 0;
    border-radius: 12px;
    box-shadow: none;
  }

  .service-row { height: 56px; padding: 12px; }
  .service-row > div { min-width: 0; gap: 12px; }
  .service-row > div > div { width: 32px; height: 32px; padding: 0; border-radius: 8px; }
  .service-row span { font-size: 14px; font-weight: 400; line-height: 20px; }
  .service-row > svg { width: 16px; height: 16px; }
  .service-row:focus-visible { outline: 2px solid #48daa6; outline-offset: -2px; }
  .divider { display: none; }
}
</style>
