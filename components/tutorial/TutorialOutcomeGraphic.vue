<script setup lang="ts">
type TutorialOutcomeStatus = 'win' | 'lose' | 'refund' | 'win-half' | 'lose-half'

interface TutorialVisualOption {
  label: string
  value?: string
  status: TutorialOutcomeStatus
}

const props = withDefaults(defineProps<{
  options: TutorialVisualOption[]
  src?: string
}>(), {
  src: undefined,
})

const statusLabels: Record<TutorialOutcomeStatus, string> = {
  win: 'win',
  lose: 'lose',
  refund: 'refund',
  'win-half': 'half win',
  'lose-half': 'half lose',
}

const outcomeImageMap: Record<string, string> = {
  'win-lose': '/tutorial-assets/outcomes/win-lose.webp',
  'lose-win': '/tutorial-assets/outcomes/lose-win.webp',
  'win-half-lose-half': '/tutorial-assets/outcomes/win-lose-half.webp',
  'lose-half-win-half': '/tutorial-assets/outcomes/lose-win-half.webp',
  'refund-refund': '/tutorial-assets/outcomes/refund.webp',
  'win-lose-lose': '/tutorial-assets/outcomes/win-lose-lose.webp',
  'lose-win-lose': '/tutorial-assets/outcomes/lose-win-lose.webp',
  'lose-lose-win': '/tutorial-assets/outcomes/lose-lose-win.webp',
  'lose-lose-lose': '/tutorial-assets/outcomes/lose-lose-lose.webp',
}

const baseImageName = computed(() => {
  if (!props.src) return ''
  const trimmed = props.src.trim()
  return trimmed
    .replace(/^.*\/outcomes\//, '')
    .replace(/\.(webp|png|jpg|jpeg)$/, '')
    .replace(/_(dark|light)$/, '')
})

const fallbackSrc = computed(() => {
  const statuses = props.options?.map(o => o.status) || []
  const key = statuses.join('-')
  if (outcomeImageMap[key]) {
    return outcomeImageMap[key]
  }

  if (statuses.length === 2) {
    if (statuses.includes('refund')) {
      return '/tutorial-assets/outcomes/refund.webp'
    }
    if (statuses[0] === 'win' || statuses[0] === 'win-half') {
      return statuses[0] === 'win-half'
        ? '/tutorial-assets/outcomes/win-lose-half.webp'
        : '/tutorial-assets/outcomes/win-lose.webp'
    }
    if (statuses[1] === 'win' || statuses[1] === 'win-half') {
      return statuses[1] === 'win-half'
        ? '/tutorial-assets/outcomes/lose-win-half.webp'
        : '/tutorial-assets/outcomes/lose-win.webp'
    }
  }

  if (statuses.length === 3) {
    if (statuses[0] === 'win') return '/tutorial-assets/outcomes/win-lose-lose.webp'
    if (statuses[1] === 'win') return '/tutorial-assets/outcomes/lose-win-lose.webp'
    if (statuses[2] === 'win') return '/tutorial-assets/outcomes/lose-lose-win.webp'
    return '/tutorial-assets/outcomes/lose-lose-lose.webp'
  }

  return '/tutorial-assets/outcomes/win-lose.webp'
})

const darkSrc = computed(() => {
  if (baseImageName.value) {
    return `/tutorial-assets/outcomes/${baseImageName.value}_dark.webp`
  }
  return fallbackSrc.value
})

const lightSrc = computed(() => {
  if (baseImageName.value) {
    return `/tutorial-assets/outcomes/${baseImageName.value}_light.webp`
  }
  return fallbackSrc.value
})

const altText = computed(() => props.options
  ?.map(option => `${option.label}${option.value ? ` ${option.value}` : ''}: ${statusLabels[option.status] || option.status}`)
  .join(', ') || 'Tutorial outcome')
</script>

<template>
  <div class="outcome-graphic-wrapper">
    <img
      class="outcome-graphic outcome-graphic--dark"
      :src="darkSrc"
      :alt="altText"
      loading="lazy"
      decoding="async"
    >
    <img
      class="outcome-graphic outcome-graphic--light"
      :src="lightSrc"
      :alt="altText"
      loading="lazy"
      decoding="async"
    >
  </div>
</template>

<style scoped>
.outcome-graphic-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  margin-top: auto;
}

.outcome-graphic {
  display: block;
  width: min(100%, 370px);
  height: 130px;
  object-fit: contain;
  object-position: center bottom;
}

.outcome-graphic--light {
  display: none;
}

.outcome-graphic--dark {
  display: block;
}

html[data-theme='light'] .outcome-graphic--dark {
  display: none;
}

html[data-theme='light'] .outcome-graphic--light {
  display: block;
}

@media (max-width: 34rem) {
  .outcome-graphic {
    transform: scale(0.9);
    transform-origin: bottom center;
  }
}
</style>
