'use client'

import * as React from 'react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Button,
  Textarea,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { promptSchema, type PromptInput } from '@/lib/validations'
import { Mixins } from './mixins'
import {
  Loader2,
  ArrowUp,
  Plus,
  GripHorizontal,
} from 'lucide-react'

interface ProducerProps {
  onSubmit: (data: PromptInput) => void
  isLoading: boolean
  defaultValue?: string
  className?: string
}

export function Producer ({
  onSubmit,
  isLoading,
  defaultValue,
  className
}: ProducerProps) {
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PromptInput>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: defaultValue || ''
    }
  })

  return (
    <div
      className={cn(
        'producer fixed bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2',
        'glass animate-float-up rounded-4xl bg-accent/80',
        'transition-all duration-300',
        'overflow-hidden',
        className
      )}>
      <div
        className={cn('-mb-8 flex px-8 opacity-0 transition-all duration-300', {
          'mb-0 opacity-100': expanded
        })}>
        <Mixins />
      </div>
      <div className="-m-px flex flex-col rounded-4xl border border-white/50 bg-black/20 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="flex-1 rounded">
            <Textarea
              {...register('prompt')}
              placeholder="Describe the portrait you want to create..."
              className="min-h-[100px] resize-none border-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="icon-button"
                disabled={isLoading}>
                <Plus />
              </Button>
              <Toggle
                pressed={expanded}
                type="button"
                variant="outline"
                className="button"
                onClick={toggleExpanded}>
                <GripHorizontal />
              </Toggle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="outline"
                className="icon-button"
                disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
