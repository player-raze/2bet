<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import SeoHeader from '~/components/SeoHeader.vue'
import MobileBonusListing from '~/components/bonuses/MobileBonusListing.vue'
import BonusCurrencySelector from '~/components/bonuses/BonusCurrencySelector.vue'
import BonusPaymentGroups from '~/components/bonuses/BonusPaymentGroups.vue'
import BonusEmptyState from '~/components/bonuses/BonusEmptyState.vue'
import PromotionComplianceFooter from '~/components/PromotionComplianceFooter.vue'
import {
  PROMOTIONS,
  PROMO_CATEGORIES,
  PROMOTION_PLACEHOLDER_IMAGES,
  PROMOTION_SECTIONS,
  getPromoBannerUrl,
  getPromotionCountdownText,
  type PromotionItem,
} from '~/data/promotions'

const props = withDefaults(defineProps<{ category?: string }>(), { category: 'all' })
const { translate } = useSitePreferences()
const { markAsViewed } = useViewedPromotions()
const { selectedCurrency, filterPromotions } = useBonusPayments()
const featuredPromotions = computed(() => filterPromotions(PROMOTIONS))
const visibleCategories = computed(() => featuredPromotions.value.length
  ? PROMO_CATEGORIES
  : PROMO_CATEGORIES.filter(category => category.key === 'all'))
const selectedCategory = ref(props.category)
watch(() => props.category, category => { selectedCategory.value = category })
const categoryPath = (key: string): string => key === 'all'
  ? '/bonuses'
  : `/bonuses/${key}`
const featuredTrack = ref<HTMLElement | null>(null)
const nowMs = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  nowMs.value = Date.now()
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

const visibleSections = computed(() => {
  return PROMOTION_SECTIONS
    .filter(section => (
      selectedCategory.value === 'all' || section.category === selectedCategory.value
    ))
    .map(section => ({ ...section, items: filterPromotions(section.items) }))
    .filter(section => section.items.length > 0)
})

watch(selectedCurrency, () => {
  featuredTrack.value?.scrollTo({ left: 0 })
})

const scrollFeatured = (direction: -1 | 1): void => {
  featuredTrack.value?.scrollBy({
    left: direction * featuredTrack.value.clientWidth * 0.78,
    behavior: 'smooth',
  })
}

const getFeaturedMeta = (promotion: PromotionItem): string => {
  return getPromotionCountdownText(promotion, nowMs.value)
}
useAppSeo({
  title: 'Bônus de Boas-Vindas e Promoções no Cassino Online | 2bet',
  description: 'Aproveite as ofertas de bônus na 2bet Brasil. Bônus de primeiro depósito, programa de convites e recompensas exclusivas do Clube VIP.',
  breadcrumbs: [
    { name: 'Início', path: '/' },
    { name: 'Promoções', path: '/bonuses' },
  ],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '2bet Promoções e Bônus',
    url: 'https://2bet.com/bonuses',
    description: 'Explore as promoções e bônus exclusivos da 2bet Brasil, incluindo o Programa Compartilhe e Ganhe e Privilégios VIP com regras claras.',
  },
})
</script>

<template>
  <div class="bonuses-page text-[#f5f5f5] light:text-[#10261c]">
    <MobileBonusListing :category="category" />
    <div class="bonuses-desktop">
    <div class="bonuses-sticky sticky-header-seal bg-black light:bg-[#f4f8f5]">
      <SeoHeader
        title="Bonuses"
        meta-title="2bet Bônus de Cassino e Promoções Exclusivas"
        description="Explore as promoções e bônus exclusivos da 2bet Brasil, incluindo o Programa Compartilhe e Ganhe e Privilégios VIP com regras claras."
        keywords="2bet bônus, USDT, Compartilhe e Ganhe, Clube VIP, promoções"
        custom-class="bonus-page-header"
      >
        <template #actions>
          <BonusCurrencySelector v-model="selectedCurrency" />
        </template>
      </SeoHeader>

      <nav class="category-nav bg-[#171817] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm" :aria-label="translate('Promotion categories')">
        <NuxtLink
          v-for="category in visibleCategories"
          :key="category.key"
          :to="categoryPath(category.key)"
          class="text-[#c3c5c4] hover:text-white light:text-[#5d7066] light:hover:text-[#10261c] hover:bg-white/5 light:hover:bg-[#eaf5ee] [&.category-nav__button--active]:!text-white [&.category-nav__button--active]:!bg-[var(--main-color)]"
          :class="{ 'category-nav__button--active': (featuredPromotions.length ? selectedCategory : 'all') === category.key }"
          :aria-current="(featuredPromotions.length ? selectedCategory : 'all') === category.key ? 'page' : undefined"
        >
          {{ translate(category.label) }}
        </NuxtLink>
      </nav>
    </div>

    <BonusEmptyState v-if="!featuredPromotions.length" />

    <section v-if="featuredPromotions.length" class="featured-promotions" :aria-label="translate('Featured promotions')">
      <button
        v-if="featuredPromotions.length > 1"
        type="button"
        class="featured-promotions__arrow featured-promotions__arrow--left light:bg-white light:text-[#10261c] light:shadow-md"
        :aria-label="translate('Previous promotions')"
        @click="scrollFeatured(-1)"
      >
        <ChevronLeft :size="15" />
      </button>

      <div ref="featuredTrack" class="featured-promotions__track">
        <NuxtLink
          v-for="promotion in featuredPromotions"
          :key="promotion.id"
          :to="`/bonus/${promotion.slug}`"
          class="featured-card bg-[#073f30] light:bg-[#015D25] light:border-emerald-600/20 light:shadow-sm"
          @click="markAsViewed(promotion.slug)"
        >
          <div class="featured-card__media light:bg-[#dce8e1]">
            <img
              :src="getPromoBannerUrl(promotion.bannerImage)"
              :alt="translate(promotion.title)"
              :style="{ objectPosition: promotion.imagePosition || 'center' }"
              loading="eager"
              decoding="async"
            >
            <span v-if="promotion.showSaveBadge" class="featured-card__save text-white bg-[#ef174c]">◎ {{ translate('Save') }}</span>
          </div>

          <div class="featured-card__copy bg-[#015D25]">
            <strong class="text-white">{{ translate(promotion.title) }}</strong>
            <span class="text-white/70">{{ translate(getFeaturedMeta(promotion)) }}</span>
          </div>
        </NuxtLink>
      </div>

      <button
        v-if="featuredPromotions.length > 1"
        type="button"
        class="featured-promotions__arrow featured-promotions__arrow--right light:bg-white light:text-[#10261c] light:shadow-md"
        :aria-label="translate('Next promotions')"
        @click="scrollFeatured(1)"
      >
        <ChevronRight :size="15" />
      </button>
    </section>

    <div v-if="featuredPromotions.length" class="promotion-groups">
      <section
        v-for="section in visibleSections"
        :key="section.id"
        class="promotion-group bg-[#151515] light:bg-white border border-white/5 light:border-[#d8e2dc] light:shadow-sm"
      >
        <NuxtLink
          :to="categoryPath(section.category)"
          class="promotion-group__heading text-[#f5f5f5] light:text-[#10261c]"
        >
          <span>{{ translate(section.title) }}</span>
          <ChevronRight :size="16" aria-hidden="true" class="text-[#808481] light:text-[#5d7066]" />
        </NuxtLink>

        <div class="promotion-group__list">
          <NuxtLink
            v-for="promotion in section.items"
            :key="`${section.id}-${promotion.id}`"
            :to="`/bonus/${promotion.slug}`"
            class="promotion-row hover:bg-white/5 light:hover:bg-[#f4f8f5]"
            @click="markAsViewed(promotion.slug)"
          >
            <img
              class="promotion-row__thumbnail bg-[#242624] light:bg-[#eaf5ee]"
              :src="promotion.thumbnailImage || PROMOTION_PLACEHOLDER_IMAGES.thumbnail"
              :alt="translate(promotion.title)"
              loading="lazy"
              decoding="async"
            >

            <span class="promotion-row__copy">
              <strong class="text-[#efefef] light:text-[#10261c]">{{ translate(promotion.title) }}</strong>
              <small class="text-[#959799] light:text-[#5d7066]">{{ translate(promotion.description) }}</small>
            </span>

            <span class="promotion-row__details bg-[#222322] light:bg-[#eaf5ee] text-[#a3a6a4] light:text-[#019440]">{{ translate('Details') }}</span>
          </NuxtLink>
        </div>
      </section>
    </div>

    <BonusPaymentGroups v-if="featuredPromotions.length" />
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 63.99rem) {
  .bonuses-desktop { display: none; }
}

.bonuses-page {
  width: 100%;
  min-width: 0;
  padding: 0;
}

.bonuses-sticky {
  position: sticky;
  z-index: 24;
  top: var(--content-sticky-top);
  margin: 0 -0.05rem 0;
  padding: 0 0.05rem 0.28rem;
  border-radius: 50px 50px 0  0 ;
}

:deep(.bonus-page-header) {
  min-height: 2.15rem;
  margin-bottom: 0.28rem;
  padding: 0.26rem 0.45rem;
  border: 1px solid rgba(255, 255, 255, 0.035);
  border-radius: 0.48rem;
}

.philippines-badge {
  display: grid;
  width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  font-size: 0.7rem;
  line-height: 1;
  background: #272827;
}

.category-nav {
  display: flex;
  align-items: center;
  min-height: 2rem;
  overflow-x: auto;
  padding: 0.22rem 0.38rem;
  border: 1px solid rgba(255, 255, 255, 0.035);
  border-radius: 0.48rem;
  scrollbar-width: none;
  gap: 0.2rem;
}

.category-nav::-webkit-scrollbar,
.featured-promotions__track::-webkit-scrollbar {
  display: none;
}

.category-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.45rem;
  flex: 0 0 auto;
  padding: 0 0.62rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 700;
  text-align: center;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  transition: color 150ms ease, background-color 150ms ease;
}

.category-nav a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
}

.category-nav a.category-nav__button--active {
  color: #ffffff;
  background: var(--main-color);
}

.featured-promotions {
  position: relative;
  margin-bottom: 0.5rem;
}

.featured-promotions__track {
  display: grid;
  grid-auto-columns: calc((100% - 0.75rem) / 4);
  grid-auto-flow: column;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline mandatory;
  scrollbar-width: none;
  gap: 0.25rem;
}

.featured-card {
  display: block;
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 0.46rem;
  color: inherit;
  text-decoration: none;
  scroll-snap-align: start;
  transition: border-color 150ms ease, transform 150ms ease;
}

.featured-card:hover {
  border-color: rgba(49, 214, 154, 0.42);
  transform: translateY(-1px);
}

.featured-card__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2.08 / 1;
}

.featured-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-card__save {
  position: absolute;
  top: 0.28rem;
  left: 0.28rem;
  padding: 0.12rem 0.3rem;
  border-radius: 999px;
  font-size: 0.44rem;
  font-weight: 800;
  box-shadow: 0 0.12rem 0.3rem rgba(0, 0, 0, 0.32);
}

.featured-card__copy {
  display: flex;
  min-width: 0;
  min-height: 2.2rem;
  flex-direction: column;
  justify-content: center;
  padding: 0.26rem 0.42rem 0.32rem;
}

.featured-card__copy strong,
.featured-card__copy span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.featured-card__copy strong {
  font-size: 0.58rem;
  font-weight: 800;
  line-height: 1.25;
}

.featured-card__copy span {
  margin-top: 0.08rem;
  font-size: 0.46rem;
}

.featured-promotions__arrow {
  display: grid;
  position: absolute;
  z-index: 2;
  top: 34%;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #ffffff;
  background: rgba(7, 10, 8, 0.82);
  box-shadow: 0 0.18rem 0.45rem rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transform: translateY(-50%);
}

.featured-promotions__arrow--left {
  left: 0.34rem;
}

.featured-promotions__arrow--right {
  right: 0.34rem;
}

.promotion-groups {
  display: flex;
  flex-direction: column;
  gap: 0.26rem;
}

.promotion-group {
  overflow: hidden;
  border-radius: 0.48rem;
}

.promotion-group__heading {
  display: flex;
  width: 100%;
  min-height: 2rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.28rem 0.48rem;
  border: 0;
  font-size: 0.68rem;
  font-weight: 800;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.promotion-group__heading svg {
  color: #808481;
}

.promotion-group__list {
  padding: 0 0.34rem 0.18rem;
}

.promotion-row {
  display: grid;
  min-height: 3.35rem;
  align-items: center;
  padding: 0.25rem 0.16rem;
  border-radius: 0.35rem;
  color: inherit;
  text-decoration: none;
  grid-template-columns: 2.35rem minmax(0, 1fr) auto;
  gap: 0.48rem;
  transition: background-color 140ms ease;
}

.promotion-row__thumbnail {
  display: block;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.34rem;
  object-fit: cover;
}

.promotion-row__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

.promotion-row__copy strong,
.promotion-row__copy small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.promotion-row__copy strong {
  font-size: 0.6rem;
  font-weight: 750;
  line-height: 1.25;
}

.promotion-row__copy small {
  margin-top: 0.08rem;
  font-size: 0.45rem;
  line-height: 1.2;
}

.promotion-row__details {
  min-width: 2.6rem;
  padding: 0.28rem 0.45rem;
  border-radius: 0.32rem;
  font-size: 0.45rem;
  font-weight: 600;
  text-align: center;
  background: #222322;
}

@media (max-width: 72rem) {
  .featured-promotions__track {
    grid-auto-columns: calc((100% - 0.5rem) / 3);
  }
}

@media (max-width: 54rem) {
  .featured-promotions__track {
    grid-auto-columns: min(72vw, 15rem);
  }

  .promotion-row {
    grid-template-columns: 2.65rem minmax(0, 1fr) auto;
  }

  .promotion-row__thumbnail {
    width: 2.65rem;
    height: 2.65rem;
  }
}

@media (max-width: 35rem) {
  .category-nav a {
    min-height: 1.7rem;
    padding: 0 0.7rem;
    font-size: 0.64rem;
  }

  .promotion-group__heading {
    min-height: 2.25rem;
    font-size: 0.74rem;
  }

  .promotion-row {
    min-height: 3.85rem;
    grid-template-columns: 2.75rem minmax(0, 1fr) auto;
  }

  .promotion-row__thumbnail {
    width: 2.75rem;
    height: 2.75rem;
  }

  .promotion-row__copy strong {
    font-size: 0.68rem;
  }

  .promotion-row__copy small,
  .promotion-row__details {
    font-size: 0.52rem;
  }
}
</style>
