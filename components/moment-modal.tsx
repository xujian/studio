'use client'

import { useRouter } from 'next/navigation'
import { MomentView } from './moment-view'
import type { MomentViewProps } from './moment-view'

type MomentModalProps = Omit<MomentViewProps, 'onClose' | 'onDragStateChange'>

export function MomentModal(props: MomentModalProps) {
  const router = useRouter()
  const onClose = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => router.back())
    } else {
      router.back()
    }
  }

  return <MomentView {...props} onClose={onClose} />
}
