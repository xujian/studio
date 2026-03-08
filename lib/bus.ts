import { useEffect, useRef, useCallback } from 'react'
import mitt, { type Handler } from 'mitt'
import type { Mixins, MomentWithPhotos } from './types'

export type MomentResumePayload = {
  momentId: string
  prompt: string
  mixins: Mixins
  reference?: string
}

type Events = {
  'generation:complete': MomentWithPhotos
  'generation:error': Error
  'moment:resume': MomentResumePayload
}

const emitter = mitt<Events>()

export function useBus() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyHandler = Handler<any>
  const subs = useRef(
    new Map<keyof Events, { wrapper: AnyHandler; current: AnyHandler }>()
  )

  // Cleanup all listeners on unmount
  useEffect(() => {
    const subsSnapshot = subs.current
    return () => {
      subsSnapshot.forEach(({ wrapper }, event) => emitter.off(event, wrapper))
      subsSnapshot.clear()
    }
  }, [])

  const on = useCallback(
    <K extends keyof Events>(event: K, handler: Handler<Events[K]>) => {
      const existing = subs.current.get(event)
      if (existing) {
        existing.current = handler as AnyHandler
      } else {
        const sub = {
          wrapper: ((data: Events[K]) => sub.current(data)) as AnyHandler,
          current: handler as AnyHandler
        }
        emitter.on(event, sub.wrapper)
        subs.current.set(event, sub)
      }
    },
    []
  )

  const emit = useCallback(
    <K extends keyof Events>(event: K, data: Events[K]) => {
      emitter.emit(event, data)
    },
    []
  )

  return { on, emit }
}
