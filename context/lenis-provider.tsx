'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

const LenisContext = createContext<Lenis | null>(null)

export const useLenis = () => useContext(LenisContext)

export const LenisProvider = ({ children }: { children: React.ReactNode }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const instance = new Lenis()
    setLenis(instance)

    let id = requestAnimationFrame(function raf(time) {
      instance.raf(time)
      id = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(id)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  // Scroll restoration only: reset to top on normal navigation. Modal routes
  // keep the background's scroll position (the modal overlays it). Scroll
  // *locking* is owned entirely by useScrollLock now — the provider no longer
  // stops/starts Lenis here.
  useEffect(() => {
    const isModal = !!pathname.match(/^\/moments\/[^/]+/)
    if (!isModal) lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
