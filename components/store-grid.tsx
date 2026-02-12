'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StoreCard } from '@/components/store-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useStore, type StoreSection } from '@/hooks/use-store'
import { ChevronRight } from 'lucide-react'

const PREVIEW_COUNT = 6

function SectionHeader({
  section,
  expanded,
  onToggle
}: {
  section: StoreSection
  expanded: boolean
  onToggle: () => void
}) {
  const hasMore = section.assets.length > PREVIEW_COUNT
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{section.name}</h2>
      {hasMore && (
        <button
          onClick={onToggle}
          className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          {expanded ? 'Show less' : 'See all'}
          <ChevronRight
            className={cn(
              'size-4 transition-transform',
              expanded && 'rotate-90'
            )}
          />
        </button>
      )}
    </div>
  )
}

function StoreSection({ section }: { section: StoreSection }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded
    ? section.assets
    : section.assets.slice(0, PREVIEW_COUNT)

  return (
    <section className="mb-10">
      <SectionHeader
        section={section}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <motion.div
        layout
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {visible.map(asset => (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              <StoreCard asset={asset} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

function StoreSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <Skeleton className="mb-3 h-6 w-24" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function StoreGrid() {
  const { data: sections, isLoading, error } = useStore()

  if (isLoading) return <StoreSkeleton />

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load store: {error.message}
      </div>
    )
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        No assets available yet
      </div>
    )
  }

  return (
    <div>
      {sections.map(section => (
        <StoreSection key={section.type} section={section} />
      ))}
    </div>
  )
}
