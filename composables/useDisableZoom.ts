/**
 * Utility to prevent zooming in and out across mobile and desktop browsers:
 * - Disables iOS Safari pinch gestures (gesturestart/change/end)
 * - Disables multi-touch pinch touchmove
 * - Disables Ctrl/Cmd + mousewheel / trackpad pinch zoom
 * - Disables Ctrl/Cmd + '+', '-', '0', '=', '_' zoom shortcuts
 */
export const setupDisableZoom = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  // 1. Prevent iOS Safari gesture zooming (pinch-to-zoom)
  const onGesture = (e: Event) => {
    e.preventDefault()
  }
  document.addEventListener('gesturestart', onGesture, { passive: false })
  document.addEventListener('gesturechange', onGesture, { passive: false })
  document.addEventListener('gestureend', onGesture, { passive: false })

  // 2. Prevent multi-touch pinch gestures on touch screens
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault()
    }
  }
  document.addEventListener('touchmove', onTouchMove, { passive: false })

  // 3. Prevent desktop wheel zoom (Ctrl + mouse wheel / trackpad pinch)
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
    }
  }
  window.addEventListener('wheel', onWheel, { passive: false })

  // 4. Prevent keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '0', '=', '_')
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomKeys = ['+', '-', '=', '_', '0']
      const zoomCodes = ['NumpadAdd', 'NumpadSubtract', 'Digit0', 'Equal', 'Minus']
      if (zoomKeys.includes(e.key) || zoomCodes.includes(e.code)) {
        e.preventDefault()
      }
    }
  }
  window.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('gesturestart', onGesture)
    document.removeEventListener('gesturechange', onGesture)
    document.removeEventListener('gestureend', onGesture)
    document.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
  }
}
