'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import type { Photo } from '@/lib/types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MomentViewProps {
  photo: Photo
  prompt: string
  onClose: () => void
}

export function MomentView({ photo, prompt, onClose }: MomentViewProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Photo Container */}
        <motion.div
          layoutId={photo.id}
          className="relative z-10 max-h-[90vh] max-w-[90vw] aspect-9/16 overflow-hidden rounded-lg"
        >
          <Image
            src={photo.url}
            alt={prompt}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </motion.div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Prompt Overlay */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white text-sm">{prompt}</p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
