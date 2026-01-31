'use client'

import { motion } from 'motion/react'

export function MomentSkeleton() {
  return (
    <motion.div
      className="relative aspect-9/16 w-full overflow-hidden rounded bg-muted"
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}
