'use client'

import { useEffect, useState } from 'react'
import { useJoyride, STATUS, EVENTS } from 'react-joyride'
import { useBus } from '@/lib/bus'

const STEPS = [
  {
    target: '[data-coach="face"]',
    content: 'Pick a face to start',
  },
  {
    target: '[data-coach="mixins"]',
    content: 'Layer your style with Mixins',
  },
  {
    target: '[data-coach="textarea"]',
    content: 'Describe your portrait here',
  },
]

const done = () => localStorage.setItem('kanojo:onboarded', '1')

export function StudioTour() {
  const [run] = useState(() => typeof window !== 'undefined' && !localStorage.getItem('kanojo:onboarded'))
  const $bus = useBus()

  const { Tour, controls, on } = useJoyride({
    steps: STEPS,
    run,
    continuous: true,
    options: {
      backgroundColor: '#ffffff33',
      textColor: '#ffffff',
      arrowColor: '#ffffff33',
      arrowSize: 8,
      buttons: ['back', 'skip', 'primary'],
      skipScroll: true,
    },
    styles: {
      tooltip: { borderRadius: 16 },
      buttonPrimary: { backgroundColor: '#ffffff33', borderRadius: 16 },
      buttonBack: { color: '#666' },
    },
  })

  useEffect(() => on(EVENTS.TOUR_END, ({ status }) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) done()
  }), [on])

  $bus.on('generation:complete', () => {
    done()
    controls.stop()
  })

  return Tour
}
