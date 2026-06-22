'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from './ui'

export type CopyButtonProps = {
  value: string
  label?: string
} & Omit<React.ComponentProps<typeof Button>, 'value' | 'onClick'>

export const CopyButton = ({ value, label, ...props }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" onClick={handleCopy} {...props}>
      {copied
        ? <Check className="size-4 text-green-500" />
        : <Copy className="size-4 text-muted-foreground" />
      }
      {label && (copied ? 'Copied' : label)}
    </Button>
  )
}
