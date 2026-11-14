<script setup lang="ts">
const props = withDefaults(defineProps<{
  glowColor?: string
  spotlightRadius?: number
  enableBorderGlow?: boolean
  enableSpotlight?: boolean
  clickEffect?: boolean
}>(), {
  glowColor: '#009440',
  spotlightRadius: 300,
  enableBorderGlow: true,
  enableSpotlight: true,
  clickEffect: true,
})

const root = ref<HTMLElement | null>(null)
const glowRgb = computed(() => {
  const hex = props.glowColor.replace(/^#/, '')
  const expanded = hex.length === 3 ? hex.replace(/./g, digit => digit + digit) : hex
  return /^[\da-f]{6}$/i.test(expanded)
    ? [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16)).join(', ')
    : '0, 148, 64'
})
let cards: HTMLElement[] = []
let frame: number | undefined
let point: { x: number; y: number } | undefined
let reducedMotion: MediaQueryList | undefined
let finePointer: MediaQueryList | undefined
const waves = new Map<HTMLElement, () => void>()

function collectCards() {
  cards = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-bento-card]') ?? [])
}

function resetLights() {
  point = undefined
  if (frame !== undefined) cancelAnimationFrame(frame)
  frame = undefined
  cards.forEach(card => {
    card.style.setProperty('--mb-hot', '0')
    card.style.setProperty('--mb-near', '0')
  })
}

function drawLights() {
  frame = undefined
  if (!point || reducedMotion?.matches || !finePointer?.matches) return
  const radius = Math.max(40, props.spotlightRadius)
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    const x = point.x - rect.left
    const y = point.y - rect.top
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
    const distance = Math.hypot(Math.max(0, -x, x - rect.width), Math.max(0, -y, y - rect.height))
    card.style.setProperty('--mb-x', `${x.toFixed(1)}px`)
    card.style.setProperty('--mb-y', `${y.toFixed(1)}px`)
    card.style.setProperty('--mb-hot', inside && props.enableSpotlight ? '1' : '0')
    card.style.setProperty('--mb-near', props.enableBorderGlow ? Math.max(0, 1 - distance / radius).toFixed(3) : '0')
  }
}

function queueLights() {
  if (point && frame === undefined) frame = requestAnimationFrame(drawLights)
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch' || reducedMotion?.matches || !finePointer?.matches) return
  point = { x: event.clientX, y: event.clientY }
  queueLights()
}

function clearWaves() {
  for (const finish of [...waves.values()]) finish()
}

function handleMotionChange() {
  resetLights()
  if (reducedMotion?.matches) clearWaves()
}

function handleClick(event: MouseEvent) {
  if (!props.clickEffect || reducedMotion?.matches || !root.value) return
  if (!(event.target instanceof Element) || !event.target.closest('[data-bento-card]')) return
  // Native links, buttons and FAQ summaries keep their normal click and keyboard actions.
  const target = event.target.closest<HTMLElement>('a,button,summary,[data-bento-card]')
  const bounds = root.value.getBoundingClientRect()
  const targetBounds = target?.getBoundingClientRect() ?? bounds
  const x = event.detail === 0 ? targetBounds.left + targetBounds.width / 2 : event.clientX
  const y = event.detail === 0 ? targetBounds.top + targetBounds.height / 2 : event.clientY
  const reach = Math.max(
    Math.hypot(x - bounds.left, y - bounds.top),
    Math.hypot(x - bounds.right, y - bounds.top),
    Math.hypot(x - bounds.left, y - bounds.bottom),
    Math.hypot(x - bounds.right, y - bounds.bottom),
  ) + 80

  clearWaves()
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    const wave = document.createElement('span')
    wave.className = 'magic-bento__wave'
    wave.setAttribute('aria-hidden', 'true')
    wave.style.setProperty('--mb-wave-x', `${x - rect.left}px`)
    wave.style.setProperty('--mb-wave-y', `${y - rect.top}px`)
    wave.style.setProperty('--mb-wave-size', `${reach * 2}px`)
    const finish = () => {
      clearTimeout(timer)
      wave.removeEventListener('animationend', finish)
      wave.remove()
      waves.delete(wave)
    }
    const timer = setTimeout(finish, 1000)
    wave.addEventListener('animationend', finish)
    waves.set(wave, finish)
    card.append(wave)
  }
}

onMounted(() => {
  collectCards()
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  reducedMotion.addEventListener('change', handleMotionChange)
  finePointer.addEventListener('change', handleMotionChange)
  window.addEventListener('scroll', queueLights, { passive: true })
})

onUpdated(collectCards)

onBeforeUnmount(() => {
  resetLights()
  clearWaves()
  reducedMotion?.removeEventListener('change', handleMotionChange)
  finePointer?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('scroll', queueLights)
})
</script>

<template>
  <div
    ref="root"
    class="magic-bento"
    :style="{ '--mb-glow-rgb': glowRgb, '--mb-spot-size': `${Math.max(40, spotlightRadius)}px` }"
    @pointermove.passive="handlePointerMove"
    @pointerleave="resetLights"
    @pointercancel="resetLights"
    @click="handleClick"
  ><slot /></div>
</template>

<style scoped>
.magic-bento { --mb-spot-alpha: .13; --mb-border-alpha: .95; }
html[data-theme='light'] .magic-bento { --mb-spot-alpha: .08; --mb-border-alpha: .75; }
.magic-bento :deep([data-bento-card]) { position: relative; isolation: isolate; }
.magic-bento :deep([data-bento-card])::before,
.magic-bento :deep([data-bento-card])::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; transition: opacity 180ms ease; }
.magic-bento :deep([data-bento-card])::before { z-index: -1; opacity: var(--mb-hot, 0); background: radial-gradient(var(--mb-spot-size) circle at var(--mb-x, -999px) var(--mb-y, -999px),rgba(var(--mb-glow-rgb),var(--mb-spot-alpha)),transparent 72%); }
.magic-bento :deep([data-bento-card])::after { z-index: 2; padding: 1px; opacity: var(--mb-near, 0); background: radial-gradient(calc(var(--mb-spot-size) * .75) circle at var(--mb-x, -999px) var(--mb-y, -999px),rgba(var(--mb-glow-rgb),var(--mb-border-alpha)),transparent 85%); -webkit-mask: linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.magic-bento :deep([data-homepage-pressed='true']) { transform: scale(.985); transition: transform 90ms ease; }
.magic-bento :deep(.magic-bento__wave) { position: absolute; z-index: 1; inset: 0; display: block; overflow: hidden; border-radius: inherit; pointer-events: none; }
.magic-bento :deep(.magic-bento__wave)::before { content: ''; position: absolute; top: var(--mb-wave-y); left: var(--mb-wave-x); width: var(--mb-wave-size); height: var(--mb-wave-size); border: 2px solid rgba(var(--mb-glow-rgb),.65); border-radius: 50%; background: radial-gradient(closest-side,transparent 96%,rgba(var(--mb-glow-rgb),.12)); transform: translate(-50%,-50%) scale(0); animation: magic-bento-wave 850ms cubic-bezier(.16,1,.3,1) both; }
@keyframes magic-bento-wave { from { opacity: .8; transform: translate(-50%,-50%) scale(0); } to { opacity: 0; transform: translate(-50%,-50%) scale(1); } }
@media (prefers-reduced-motion: reduce) { .magic-bento :deep([data-bento-card])::before,.magic-bento :deep([data-bento-card])::after,.magic-bento :deep(.magic-bento__wave) { display: none; } }
</style>
