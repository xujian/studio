'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Code } from '@/components/code'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui'
import {
  Copy,
  Earth,
  Ellipsis,
  FileOutput,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { assetTypeNames } from '@/lib/types'
import type { AssetType } from '@/lib/types'
import { formatJson, isJson } from '@/lib/utils/string'
import { useScrollBlock } from '@/hooks/use-scroll-block'

export type MomentPromptProps = {
  value: string
}

const languages = ['日本語', '漢語']

export const MomentPrompt = ({ value }: MomentPromptProps) => {
  const [extracting, setExtracting] = useState<boolean>(false)
  const [translating, setTranslating] = useState<boolean>(false)
  const [result, setResult] = useState<{ title: string; content: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [blockScroll, allowScroll] = useScrollBlock()

  const handleExtract = async (type: AssetType) => {
    setExtracting(true)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value, type }),
      })
      const { content, error } = await res.json()
      setResult({ title: `Extracted ${type}`, content: error ?? content })
    } finally {
      setExtracting(false)
    }
  }

  const handleTranslate = async (language: string) => {
    setTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value, language }),
      })
      const { content, error } = await res.json()
      setResult({ title: language, content: error ?? content })
    } finally {
      setTranslating(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.content) return
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const promptIsJson = useMemo(() => isJson(value), [value])

  // Lenis detects this via hasAttribute (presence, not value) and scans the
  // whole ancestor chain, so it must be omitted — not set to false — when off.
  const preventWheel = promptIsJson && expanded ? '' : undefined

  useEffect(() => {
    if (promptIsJson && expanded) {
      blockScroll()
    } else {
      allowScroll()
    }
    return () => allowScroll()
  }, [promptIsJson, expanded])

  return (
    <>
      <div
        data-lenis-prevent-wheel={preventWheel}
        className={cn(
        'relative rounded-2xl border py-4 backdrop-blur-3xl',
        expanded && 'absolute z-100 left-0 right-4 top-4 bottom-4'
      )}>
        <Badge className="absolute -top-2 left-1 bg-background/80 text-foreground">
          Prompt
        </Badge>
        <motion.div
          data-lenis-prevent-wheel={preventWheel}
          className="scrolling h-full overflow-y-scroll"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => value && setExpanded(!expanded)}>
          <div
            className={cn(
              'prompt-content px-4',
              expanded ? '' : 'max-h-26 overflow-y-hidden',
              value && 'cursor-pointer'
            )}>
            {
            value
              ? promptIsJson
                ? (<Code>{ formatJson(value) }</Code>)
                : (<p className="text-xs text-foreground">{value}</p>)
              : (<p className="text-xs text-foreground">{'(EMPTY)'}</p>)
            }
          </div>
        </motion.div>
        {value &&
          (<div className="absolute left-2 -bottom-4 z-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" className="h-6 w-8 bg-background!" variant="outline">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full z-200 text-xs">
                <DropdownMenuItem className="text-xs">
                  <Copy className="size-4 text-muted-foreground" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <FileOutput className="size-4 text-muted-foreground" />
                    Extract
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {assetTypeNames.map((name) => (
                      <DropdownMenuItem
                        key={name}
                        className="text-xs"
                        disabled={extracting}
                        onClick={() => handleExtract(name as AssetType)}>
                        {name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <Earth className="size-4 text-muted-foreground" />
                    Translate
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        className="text-xs"
                        disabled={translating}
                        onClick={() => handleTranslate(lang)}>
                        {lang}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>)}
      </div>
      <Dialog
        open={!!result || extracting || translating}
        onOpenChange={(open) => { if (!open) setResult(null) }}>
        <DialogContent
          className="prompt-process z-100 p-2 rounded-3xl max-w-160!"
          onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="capitalize text-sm leading-6 my-0 px-2">
              {result?.title || (<Loader2 className="size-3 animate-spin" />)}
            </DialogTitle>
          </DialogHeader>
          <div className="px-2">
            {result?.content
              ? isJson(result.content)
                ? <pre>{formatJson(result.content)}</pre>
                : <div className="text-sm text-muted-foreground whitespace-pre-wrap">{result.content}</div>
              : (<p className="text-sm text-muted-foreground">
                  {extracting
                    ? '(extracting...)'
                    : translating
                      ? '(translating...)'
                      : '(nothing found)'
                  }
                </p>)
            }
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="icon-sm"
              className=""
              onClick={handleCopy}
              disabled={!result?.content}>
              <Copy className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
