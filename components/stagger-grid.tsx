'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

interface StaggerGridProps {
  children: React.ReactNode
  className?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  return (
    <motion.div
      className={cn('grid', className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence mode="popLayout">
        {React.Children.map(children, (child) => {
          // Extract key from child for AnimatePresence
          const key = React.isValidElement(child) ? child.key : undefined

          return (
            <motion.div
              key={key}
              variants={item}
              layout
              exit="exit"
            >
              {child}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
