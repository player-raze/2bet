import { setupPlaynowTracker } from '~/utils/playnowTracker'

let teardownTracker: (() => void) | undefined

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  teardownTracker?.()
  const config = useRuntimeConfig()
  const bloggeristUrl = String(config.public?.bloggeristUrl || '').trim()

  teardownTracker = setupPlaynowTracker({ bloggeristUrl })
})
