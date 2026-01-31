'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

interface MagneticCardProps {
  children: React.ReactNode
  strength?: number
}

export function MagneticCard({ children, strength = 1 }: MagneticCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // If touch device, render children without motion effects
  if (isTouchDevice) {
    return <div ref={ref}>{children}</div>
  }

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), {
    stiffness: 150,
    damping: 15,
    mass: 0.5
  })

  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), {
    stiffness: 150,
    damping: 15,
    mass: 0.5
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = (e.clientX - centerX) * strength
    const distanceY = (e.clientY - centerY) * strength

    x.set(distanceX)
    y.set(distanceY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  )
}
