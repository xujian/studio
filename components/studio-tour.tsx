'use client'

import { useEffect, useState } from 'react'
import { useJoyride, STATUS, EVENTS } from 'react-joyride'
import { useBus } from '@/lib/bus'

const content1 = () => (
  <div className="10">
    <label className="seq absolute top-1 left-1">1</label>
    <p>Pick a face to start</p>
  </div>
)
const content2 = () => (
  <div className="10">
    <label className="seq absolute top-1 left-1">2</label>
    <p>Upload a reference image</p>
  </div>
)
const content3 = () => (
  <div className="10">
    <label className="seq absolute top-1 left-1">3</label>
    <p>Layer your style with Mixins</p>
  </div>
)
const content4 = () => (
  <div className="10">
    <label className="seq absolute top-1 left-1">4</label>
    <p>Describe your portrait here</p>
  </div>
)

const STEPS = [
  {
    target: '[data-coach="face"]',
    content: content1(),
    primaryColor: '#ffffff88',
  },
  {
    target: '[data-coach="reference"]',
    content: content2(),
    primaryColor: '#ffffff88',
  },
  {
    target: '[data-coach="mixins"]',
    content: content3(),
    primaryColor: '#ffffff88',
  },
  {
    target: '[data-coach="textarea"]',
    content: content4(),
    primaryColor: '#ffffff88',
  },
]

// const done = () => localStorage.setItem('kanojo:onboarded', '1')

export function StudioTour() {
  const [run] = useState(() => 
    typeof window !== 'undefined'
      && !localStorage.getItem('kanojo:onboarded')
  )
  const $bus = useBus()

  const { Tour, controls, on } = useJoyride({
    steps: STEPS,
    run: true,
    continuous: true,
    options: {
      backgroundColor: '#ffffff33',
      textColor: '#ffffff',
      arrowColor: '#ffffff33',
      arrowBase: 16,
      arrowSize: 8,
      buttons: ['back', 'skip', 'primary'],
      skipScroll: true,
      spotlightRadius: 20,
    },
    styles: {
      floater: {
        filter: 'none',
      },
      tooltip: {
        fontSize: 12,
        borderRadius: 20,
        backdropFilter: 'blur(50px)',
        padding: 4,
      },
      buttonPrimary: {
        backgroundColor: '#000000',
        fontSize: 11,
        borderRadius: 16,
        color: '#fff'
      },
      buttonSkip: {
        backgroundColor: '#00000033',
        fontSize: 11,
        borderRadius: 16
      },
      buttonBack: {
        backgroundColor: '#00000033',
        borderRadius: 16,
        fontSize: 11,
      },
      spotlight: {
        stroke: '#ffffff',
        strokeWidth: 1,
        strokeDasharray: '2 2',
      },
    },
  })

  useEffect(() => on(EVENTS.TOUR_END, ({ status }) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // done()
    }
  }), [on])

  $bus.on('generation:complete', () => {
    // done()
    controls.stop()
  })

  return Tour
}
