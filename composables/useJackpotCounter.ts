const DEFAULT_JACKPOT_AMOUNTS: Record<string, number> = {
  mega: 1_008_450.25,
  jdb: 1_500,
  jili: 8_017.37,
  cq9: 6_503.35,
  grand: 354_120.50,
  major: 86_410.20,
  minor: 12_740.10,
}

export type JackpotTierKey = 'mega' | 'jdb' | 'jili' | 'cq9' | 'grand' | 'major' | 'minor'

export interface JackpotCounterOptions {
  /** Shared state key. Components using the same key show the same amount. */
  key: JackpotTierKey
  /** Seeds the starting amount (runs once, server-side during SSR). */
  initial: () => number
  /** Random increment range per tick, in pesos (100 or less). */
  step: readonly [number, number]
  /** Random decrement range per tick, in pesos (100 or less). */
  decreaseStep?: readonly [number, number]
  /** Probability (0 to 1) of a tick being an increase vs decrease. Defaults to ~0.60. */
  increaseProbability?: number
  /** Random delay range between ticks, in milliseconds (~1 minute default). */
  delayMs?: readonly [number, number]
  /** Delay range before the first tick after mounting, in milliseconds. */
  initialDelayMs?: readonly [number, number]
  /** Minimum baseline amount; when at or below this, the counter only increases. */
  min?: number
  /** Maximum threshold; when at or above this, the counter only decreases (or resets if resetOnMax is true). */
  max?: number
  /** When true, reaching or exceeding `max` resets the counter back to `min` instead of clamping near `max`. */
  resetOnMax?: boolean
}

interface ActiveTicker {
  subscribers: number
  timer: ReturnType<typeof setTimeout> | null
}

const DEFAULT_DELAY_MS = [3_000, 3_000] as const
const DEFAULT_INITIAL_DELAY_MS = [3_000, 3_000] as const
const TWEEN_MAX_DURATION_MS = 1_500

// One ticker per key, so several components sharing a counter don't double-increment it.
const activeTickers = new Map<string, ActiveTicker>()

// Batch saving to data/jackpots.json via /api/jackpots with debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null
const pendingSaves: Partial<Record<JackpotTierKey, number>> = {}

const queueJackpotSave = (key: JackpotTierKey, value: number): void => {
  pendingSaves[key] = value

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`2bet-jackpot:${key}`, String(value))
    } catch {}
  }

  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    saveTimer = null
    const payload = { ...pendingSaves }
    try {
      await $fetch('/api/jackpots', {
        method: 'POST',
        body: payload,
      })
    } catch {}
  }, 800)
}

// Deduplicate initial server sync across mounted jackpot components
let initialFetchPromise: Promise<Record<string, number> | null> | null = null

const fetchLatestJackpots = (): Promise<Record<string, number> | null> => {
  if (!initialFetchPromise) {
    initialFetchPromise = $fetch<Record<string, number>>('/api/jackpots').catch(() => null)
  }
  return initialFetchPromise
}

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min)
const toCents = (value: number): number => Math.round(value * 100) / 100

const jackpotAmountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatJackpotAmount = (value: number): string => jackpotAmountFormatter.format(value)

const getInitialJackpotAmount = (key: string, fallback: number): number => {
  const value = DEFAULT_JACKPOT_AMOUNTS[key]
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

/** Normalize a cached or persisted jackpot amount against configured min/max and reset-on-max bounds. */
export const normalizeHydratedJackpotAmount = (
  value: number,
  options: Pick<JackpotCounterOptions, 'min' | 'max' | 'resetOnMax'>,
): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  const minBound = options.min ?? 0
  const maxBound = options.max ?? Number.POSITIVE_INFINITY
  if (options.resetOnMax && value >= maxBound) return toCents(minBound)
  if (value < minBound) return toCents(minBound)
  if (value > maxBound) return toCents(maxBound)
  return toCents(value)
}

/** Advance a jackpot counter by one tick, resetting back to `min` when `resetOnMax` triggers at `max`. */
export const computeNextJackpotAmount = (
  current: number,
  options: Pick<JackpotCounterOptions, 'min' | 'max' | 'step' | 'decreaseStep' | 'increaseProbability' | 'resetOnMax'>,
  randomFn: () => number = Math.random,
): number => {
  const minBound = options.min ?? 0
  const maxBound = options.max ?? Number.POSITIVE_INFINITY
  if (options.resetOnMax && current >= maxBound) {
    return toCents(minBound)
  }

  let isIncrease: boolean
  if (current <= minBound) {
    isIncrease = true
  } else if (current >= maxBound) {
    isIncrease = false
  } else {
    const prob = options.increaseProbability ?? 0.6
    isIncrease = randomFn() < prob
  }

  const deltaRange = isIncrease
    ? options.step
    : (options.decreaseStep ?? [options.step[0] * 0.7, options.step[1] * 0.85])

  const delta = deltaRange[0] + randomFn() * (deltaRange[1] - deltaRange[0])
  const nextRaw = isIncrease ? current + delta : current - delta
  if (options.resetOnMax && nextRaw >= maxBound) {
    return toCents(minBound)
  }
  return toCents(Math.max(minBound, Math.min(maxBound, nextRaw)))
}

export const MEGA_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'mega',
  initial: () => getInitialJackpotAmount('mega', 1_008_450.25),
  min: 1_000_000,
  max: 1_250_000,
  step: [12, 85],
  decreaseStep: [8, 65],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const JDB_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'jdb',
  initial: () => getInitialJackpotAmount('jdb', 1_500),
  min: 1_500,
  max: 8_000,
  resetOnMax: true,
  step: [0.5, 6],
  decreaseStep: [0.3, 4.5],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const JILI_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'jili',
  initial: () => getInitialJackpotAmount('jili', 7_854.20),
  min: 5_000,
  max: 15_000,
  step: [1, 15],
  decreaseStep: [0.8, 11],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const CQ9_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'cq9',
  initial: () => getInitialJackpotAmount('cq9', 6_328.50),
  min: 5_000,
  max: 15_000,
  step: [1, 12],
  decreaseStep: [0.7, 9],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const GRAND_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'grand',
  initial: () => getInitialJackpotAmount('grand', 354_120.50),
  min: 350_000,
  max: 420_000,
  step: [6, 45],
  decreaseStep: [4, 35],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const MAJOR_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'major',
  initial: () => getInitialJackpotAmount('major', 86_410.20),
  min: 85_000,
  max: 110_000,
  step: [3, 22],
  decreaseStep: [2, 18],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const MINOR_JACKPOT_COUNTER: JackpotCounterOptions = {
  key: 'minor',
  initial: () => getInitialJackpotAmount('minor', 12_740.10),
  min: 12_500,
  max: 18_000,
  step: [1, 8],
  decreaseStep: [0.5, 6.5],
  increaseProbability: 0.6,
  delayMs: [3_000, 3_000],
  initialDelayMs: [3_000, 3_000],
}

export const useJackpotCounter = (options: JackpotCounterOptions) => {
  const amount = useState<number>(`jackpot-counter:${options.key}`, () => toCents(options.initial()))
  const displayAmount = ref(amount.value)
  const storageKey = `2bet-jackpot:${options.key}`
  const lastTickKey = `${storageKey}:last-tick`
  const [minDelay, maxDelay] = options.delayMs ?? DEFAULT_DELAY_MS
  const initialDelayRange = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS
  let frameId: number | null = null
  let mounted = false

  const readCachedAmount = (): number | null => {
    try {
      const cached = localStorage.getItem(storageKey) ?? localStorage.getItem(`bybet-jackpot:${options.key}`)
      return cached === null ? null : normalizeHydratedJackpotAmount(Number(cached), options)
    } catch {
      return null
    }
  }

  const syncStoredAmount = (event: StorageEvent): void => {
    if (event.key !== storageKey || event.newValue === null) return
    const normalized = normalizeHydratedJackpotAmount(Number(event.newValue), options)
    if (normalized !== null) amount.value = normalized
  }

  const stopTween = (): void => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      frameId = null
    }
  }

  const animateTo = (target: number): void => {
    stopTween()
    const from = displayAmount.value

    if (typeof window === 'undefined') {
      displayAmount.value = target
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const maxDecreaseStep = Math.max(...(options.decreaseStep ?? options.step))
    const isResetJump = Boolean(options.resetOnMax && target === toCents(options.min ?? 0) && from - target > maxDecreaseStep)
    if (prefersReducedMotion || document.hidden || from === target || isResetJump) {
      displayAmount.value = target
      return
    }

    // Smooth cubic ease-out tweening over ~1.2s for gentle per-minute transitions
    const duration = Math.min(TWEEN_MAX_DURATION_MS, 1_200)
    const startedAt = performance.now()

    const step = (now: number): void => {
      const elapsed = now - startedAt
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - progress) ** 3
      displayAmount.value = toCents(from + (target - from) * eased)
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step)
      } else {
        frameId = null
        displayAmount.value = target
      }
    }

    frameId = window.requestAnimationFrame(step)
  }

  const scheduleTick = (ticker: ActiveTicker, delay?: number): void => {
    const waitTime = delay ?? randomBetween(minDelay, maxDelay)
    ticker.timer = setTimeout(async () => {
      try {
        if (!document.hidden) {
          const advance = (): void => {
            if (ticker.subscribers <= 0) return
            // Tabs share the same amount and take turns advancing it only once per interval.
            const cached = readCachedAmount()
            if (cached !== null) amount.value = cached
            try {
              const lastTick = Number(localStorage.getItem(lastTickKey))
              if (Date.now() - lastTick < minDelay) return
              localStorage.setItem(lastTickKey, String(Date.now()))
            } catch {}
            amount.value = computeNextJackpotAmount(amount.value, options)
            queueJackpotSave(options.key, amount.value)
          }

          if (navigator.locks) {
            await navigator.locks.request(storageKey, advance)
          } else {
            advance()
          }
        }
      } finally {
        if (ticker.subscribers > 0) scheduleTick(ticker)
      }
    }, waitTime)
  }

  watch(amount, animateTo)

  onMounted(() => {
    mounted = true
    window.addEventListener('storage', syncStoredAmount)
    // Preserve the shared value when navigating between the homepage and jackpot page.
    const cached = readCachedAmount()
    if (cached !== null) amount.value = cached
    displayAmount.value = amount.value

    // Seed from the server only when this browser has no newer shared value.
    fetchLatestJackpots().then((serverData) => {
      if (!mounted || readCachedAmount() !== null) return
      if (serverData && typeof serverData[options.key] === 'number') {
        const serverVal = serverData[options.key]
        const normalized = normalizeHydratedJackpotAmount(serverVal, options)
        if (normalized !== null) {
          if (Math.abs(normalized - amount.value) > 0.01) {
            amount.value = normalized
            displayAmount.value = normalized
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem(`2bet-jackpot:${options.key}`, String(normalized))
              } catch {}
            }
          }
          if (Math.abs(normalized - serverVal) > 0.01) {
            queueJackpotSave(options.key, normalized)
          }
        }
      }
    })

    // 3. Register ticker subscriber
    const ticker = activeTickers.get(options.key) ?? { subscribers: 0, timer: null }
    ticker.subscribers += 1
    activeTickers.set(options.key, ticker)
    if (ticker.subscribers === 1) {
      scheduleTick(ticker, randomBetween(initialDelayRange[0], initialDelayRange[1]))
    }
  })

  onBeforeUnmount(() => {
    mounted = false
    window.removeEventListener('storage', syncStoredAmount)
    stopTween()

    const ticker = activeTickers.get(options.key)
    if (!ticker) return

    ticker.subscribers -= 1
    if (ticker.subscribers <= 0) {
      if (ticker.timer) clearTimeout(ticker.timer)
      activeTickers.delete(options.key)
    }
  })

  return { amount, displayAmount }
}
