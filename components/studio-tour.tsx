'use client'

import { useState } from 'react'
import Joyride, { type CallBackProps, STATUS } from 'react-joyride'
import { useBus } from '@/lib/bus'

const STEPS = [
  {
    target: '[data-coach="face"]',
    content: 'Pick a face to start',
    disableBeacon: true,
  },
  {
    target: '[data-coach="mixins"]',
    content: 'Layer your style with Mixins',
    disableBeacon: true,
  },
  {
    target: '[data-coach="textarea"]',
    content: 'Describe your portrait here',
    disableBeacon: true,
  },
]

const done = () => localStorage.setItem('kanojo:onboarded', '1')

export function StudioTour() {
  const [run, setRun] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('kanojo:onboarded')
  )
  const $bus = useBus()

  $bus.on('generation:complete', () => {
    done()
    setRun(false)
  })

  const handleCallback = ({ status }: CallBackProps) => {
    if ((status === STATUS.FINISHED || status === STATUS.SKIPPED)) {
      done()
      setRun(false)
    }
  }

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      disableScrolling
      callback={handleCallback}
    />
  )
}
