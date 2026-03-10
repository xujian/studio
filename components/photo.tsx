'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { photoUrl } from '@/lib/utils'
import type { Photo as PhotoType } from '@/lib/types'

interface PhotoProps {
  data: PhotoType
  className?: string
}

export function Photo({ data, className }: PhotoProps) {
  return (
    <Link
      href={`/moments/${data.moment_id}?photo=${data.id}`}
      className={className}
    >
      <motion.div
        layoutId={data.id}
        className="relative h-full w-full"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={photoUrl(data.user_id, data.moment_id, data.id)}
          alt=""
          fill
          loading="lazy"
          className="object-cover"
          sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
        />
      </motion.div>
    </Link>
  )
}
