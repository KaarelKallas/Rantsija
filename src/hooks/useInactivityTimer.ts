import { useEffect, useRef } from 'react'
import type { Router } from '@tanstack/react-router'

/**
 * Inactivity timer that navigates home after timeout — unless a video is playing.
 */
export function useInactivityTimer(
  router: Router,
  timeoutMs = 20 * 60 * 1000,
  videoPlayingRef?: React.MutableRefObject<boolean>
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const videoPlaying = videoPlayingRef?.current
      if (videoPlaying) {
        // 🛑 Skip reset if video is still playing
        console.log('⏸ Video playing — delaying kiosk timeout')
        resetTimer()
        return
      }
      console.log('🕒 Kiosk timeout reached — returning to home...')
      router.navigate({ to: '/' })
    }, timeoutMs)
  }

  useEffect(() => {
    const handleActivity = () => resetTimer()
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart']

    events.forEach((e) => window.addEventListener(e, handleActivity))
    resetTimer()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      events.forEach((e) => window.removeEventListener(e, handleActivity))
    }
  }, [router, timeoutMs])
}
