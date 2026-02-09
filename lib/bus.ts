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
  const subs = useRef(
    new Map<keyof Events, { wrapper: Handler<any>; current: Handler<any> }>()
  )

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      subs.current.forEach(({ wrapper }, event) => emitter.off(event, wrapper))
      subs.current.clear()
    }
  }, [])

  const on = useCallback(
    <K extends keyof Events>(event: K, handler: Handler<Events[K]>) => {
      const existing = subs.current.get(event)
      if (existing) {
        existing.current = handler
      } else {
        const sub = {
          wrapper: ((data: any) => sub.current(data)) as Handler<any>,
          current: handler as Handler<any>
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
