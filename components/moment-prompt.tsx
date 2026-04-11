'use client'

import { useState } from 'react'
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui'
import {
  Check,
  Copy,
  Earth,
  Ellipsis,
  FileOutput,
  Loader2,
} from 'lucide-react'
import { assetTypeNames } from '@/lib/types'
import type { AssetType } from '@/lib/types'

export type MomentPromptProps = {
  value: string
}

const languages = ['日本語', '漢語']

const isJson = (str: string) => {
  try { JSON.parse(str); return true } catch { return false }
}

export const MomentPrompt = ({ value }: MomentPromptProps) => {
  const [extracting, setExtracting] = useState<boolean>(false)
  const [translating, setTranslating] = useState<boolean>(false)
  const [result, setResult] = useState<{ title: string; content: string } | null>({
    title: 'Extracted',
    content: `{
  "setting": "cozy rustic wooden cabin",
  "background": "authentic cabin details: black cast-iron wood-burning stove with brick surround, wooden panel walls, vintage wooden dresser, and potted plants on the mantel",
  "foreground": "large red patterned Persian rug"
}`
  })
  const [copied, setCopied] = useState(false)

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

  return (
    <>
      <div className="relative rounded-2xl border bg-linear-to-t from-background/80 to-background/40 p-4">
        <Badge className="absolute -top-2 left-1 bg-background/80 text-foreground">
          Prompt
        </Badge>
        <motion.div
          className="relative inset-0 max-h-26 overflow-clip"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <p className="text-xs text-foreground">{value || '(EMPTY)'}</p>
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
                ? <Code>{result.content}</Code>
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
