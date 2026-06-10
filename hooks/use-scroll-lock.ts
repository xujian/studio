'use client'

import { useEffect } from 'react'
import { useLenis } from '@/context/lenis-provider'

// Single source of truth for page scroll locking. Owns BOTH layers at once:
//   1. native document scroll  → CSS `overflow: hidden` on <html>/<body>
//   2. Lenis virtual scroll     → lenis.stop()
//
// A module-level reference count coordinates multiple simultaneous lockers
// (e.g. a modal route + an expanded overlay): the page only unlocks when the
// last locker releases. Because lock and unlock always travel together through
// this one path, "Lenis stopped but CSS still locked" (and the reverse) is
// structurally impossible.
let lockCount = 0

const applyLock = () => {
  const html = document.documentElement
  const { body } = document
  if (!body?.style) return

  // Compensate for the now-hidden scrollbar so content doesn't shift.
  const scrollBarWidth = window.innerWidth - html.clientWidth
  const bodyPaddingRight =
    parseInt(window.getComputedStyle(body).getPropertyValue('padding-right')) || 0

  html.style.position = 'relative'
  body.style.position = 'relative'
  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'
  body.style.paddingRight = `${bodyPaddingRight + scrollBarWidth}px`
}

const removeLock = () => {
  const html = document.documentElement
  const { body } = document
  if (!body?.style) return

  html.style.position = ''
  body.style.position = ''
  html.style.overflow = ''
  body.style.overflow = ''
  body.style.paddingRight = ''
}

export const useScrollLock = (locked: boolean) => {
  const lenis = useLenis()

  useEffect(() => {
    if (!locked || typeof document === 'undefined') return

    lockCount += 1
    if (lockCount === 1) {
      applyLock()
      lenis?.stop()
    }

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        removeLock()
        lenis?.start()
      }
    }
  }, [locked, lenis])
}
