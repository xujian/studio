'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { StoreCard } from '@/components/store-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, type StoreSection } from '@/hooks/use-store'
import { cn } from '@/lib/utils'

const PREVIEW_COUNT = 4

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
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">{section.name}</h2>
      {hasMore && (
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {expanded ? 'Show less' : 'See all'}
          <ChevronRight className={cn(
            'size-4 transition-transform',
            expanded && 'rotate-90'
          )} />
        </button>
      )}
    </div>
  )
}

function StoreSection({ section }: { section: StoreSection }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? section.assets : section.assets.slice(0, PREVIEW_COUNT)

  return (
    <section className="mb-10">
      <SectionHeader
        section={section}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <motion.div
        layout
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {visible.map(asset => (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
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
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="aspect-[9/16] w-full rounded-lg" />
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
      <div className="text-muted-foreground text-center py-20">
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
