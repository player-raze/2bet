import { FEATURED_PROMOTIONS, type FeaturedPromo } from '~/data/promotions'

const presentation: Array<{
  id: string
  tone: string
  bannerImage: string
  title: string
  description: string
  rate?: string
  slug: string
  accentColor: string
  imagePosition?: string
}> = [
  {
    id: 'bonus-da-virada-8-x-9',
    tone: 'live-casino',
    bannerImage: '/images/promotions/bonus_da_virada_8_x_9.png',
    title: 'BÔNUS DA VIRADA 8 x 9',
    description: 'Até R$ 5.888 no Bacará ao Vivo',
    rate: 'Até R$ 5.888',
    slug: 'bonus-da-virada-8-x-9',
    accentColor: '#009440',
    imagePosition: 'center',
  },
  {
    id: 'seu-primeiro-deposito',
    tone: 'slots',
    bannerImage: '/images/promotions/seu_primeiro_deposito_header.webp',
    title: 'Seu Primeiro Depósito Vale Mais!',
    description: 'Até R$ 10.000 em Bônus de Boas-Vindas',
    slug: 'seu-primeiro-deposito',
    accentColor: '#019440',
    imagePosition: '76% center',
  },
  {
    id: 'bonus-diario-de-recuperacao',
    tone: 'sports',
    bannerImage: '/images/promotions/bonus_diario_de_recuperacao_header.webp',
    title: 'Bônus Diário de Recuperação',
    description: 'Até R$ 18.888 de Volta em Perdas',
    slug: 'bonus-diario-de-recuperacao',
    accentColor: '#10b981',
    imagePosition: '76% center',
  },
  {
    id: 'vip-privileges',
    tone: 'live-casino',
    bannerImage: '/images/promotions/programa_vip_header.webp',
    title: 'Sistema de Privilégios VIP',
    description: 'Cashback e Benefícios Exclusivos',
    slug: 'vip-privileges',
    accentColor: '#8b5cf6',
    imagePosition: '76% center',
  },
  {
    id: 'share-and-earn',
    tone: 'rankings',
    bannerImage: '/images/promotions/share_and_earn_header.webp',
    title: 'Programa Compartilhe e Ganhe',
    description: 'Comissões Contínuas por Convite',
    slug: 'share-and-earn',
    accentColor: '#019440',
    imagePosition: '76% center',
  },
]

export const HOMEPAGE_PROMOTIONS = presentation.map(visual => {
  const match = FEATURED_PROMOTIONS.find(promotion => promotion.id === visual.id || promotion.slug === visual.slug)
  return {
    ...visual,
    ...(match || {}),
    bannerImage: visual.bannerImage,
    tone: visual.tone,
    imagePosition: visual.imagePosition || match?.imagePosition || '76% center',
  }
})

