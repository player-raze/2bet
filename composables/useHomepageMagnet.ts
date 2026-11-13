import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const controls = 'button, a[href], [role="button"], input[type="button"], input[type="submit"], summary'
const returnDuration = 240

function isMagnetExcluded(element: HTMLElement): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (current.classList?.contains('getting-started-faq') || current.classList?.contains('allgames-footer')) return true
  }
  return false
}

export function setupHomepageMagnet(root: HTMLElement): () => void {
  const view = root.ownerDocument.defaultView
  if (!view) return () => {}

  const motion = view.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  const elements = new Map<HTMLElement, {
    translate: string
    transition: string
    bounds: DOMRect
    timer?: number
  }>()
  let active: HTMLElement | undefined
  let frame: number | undefined
  let point = { x: 0, y: 0 }

  function restore(element: HTMLElement) {
    const saved = elements.get(element)
    if (!saved) return
    view!.clearTimeout(saved.timer)
    element.style.translate = saved.translate
    element.style.transition = saved.transition
    elements.delete(element)
  }

  function release() {
    if (frame !== undefined) view!.cancelAnimationFrame(frame)
    frame = undefined
    if (!active) return
    const element = active
    active = undefined
    const saved = elements.get(element)
    if (!saved) return
    element.style.translate = '0px 0px'
    saved.timer = view!.setTimeout(() => restore(element), returnDuration)
  }

  function reset() {
    release()
    for (const element of elements.keys()) restore(element)
  }

  function move(event: PointerEvent) {
    if (!motion.matches || event.pointerType !== 'mouse') return
    const target = event.target instanceof view!.Element ? event.target.closest(controls) : null
    if (!(target instanceof view!.HTMLElement) || !root.contains(target)
      || target.matches(':disabled, [aria-disabled="true"]')
      || target.closest('[inert]')
      || isMagnetExcluded(target)) {
      release()
      return
    }

    if (active !== target) {
      release()
      let saved = elements.get(target)
      if (!saved) {
        saved = {
          translate: target.style.translate,
          transition: target.style.transition,
          bounds: target.getBoundingClientRect(),
        }
        elements.set(target, saved)
        const transition = view!.getComputedStyle(target).transition
        target.style.transition = `${transition}, translate ${returnDuration}ms cubic-bezier(.22,1,.36,1)`
      }
      view!.clearTimeout(saved.timer)
      active = target
    }

    point = { x: event.clientX, y: event.clientY }
    if (frame !== undefined) return
    frame = view!.requestAnimationFrame(() => {
      frame = undefined
      if (!active || !motion.matches) return
      const bounds = elements.get(active)!.bounds
      const x = Math.max(-7, Math.min(7, (point.x - bounds.left - bounds.width / 2) * .18))
      const y = Math.max(-5, Math.min(5, (point.y - bounds.top - bounds.height / 2) * .18))
      // Individual translate preserves each control's existing transform/hover animation.
      active.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
    })
  }

  function leave(event: PointerEvent) {
    if (active && !(event.relatedTarget instanceof view!.Node && active.contains(event.relatedTarget))) release()
  }

  root.addEventListener('pointermove', move, { passive: true })
  root.addEventListener('pointerout', leave, { passive: true })
  root.addEventListener('pointerleave', release, { passive: true })
  root.addEventListener('focusin', reset)
  view.addEventListener('scroll', reset, { passive: true, capture: true })
  view.addEventListener('resize', reset, { passive: true })
  view.addEventListener('blur', reset)
  motion.addEventListener('change', reset)

  return () => {
    root.removeEventListener('pointermove', move)
    root.removeEventListener('pointerout', leave)
    root.removeEventListener('pointerleave', release)
    root.removeEventListener('focusin', reset)
    view.removeEventListener('scroll', reset, true)
    view.removeEventListener('resize', reset)
    view.removeEventListener('blur', reset)
    motion.removeEventListener('change', reset)
    reset()
  }
}

export function useHomepageMagnet(root: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | undefined
  onMounted(() => { if (root.value) cleanup = setupHomepageMagnet(root.value) })
  onBeforeUnmount(() => cleanup?.())
}
