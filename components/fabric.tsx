'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { promptSchema, type PromptInput } from '@/lib/validations'
import { Loader2 } from 'lucide-react'

interface FabricProps {
  onSubmit: (data: PromptInput) => void
  isLoading: boolean
  defaultValue?: string
  className?: string
}

export function Fabric({
  onSubmit,
  isLoading,
  defaultValue,
  className
}: FabricProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PromptInput>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: defaultValue || ''
    }
  })

  const prompt = watch('prompt')
  const charCount = prompt?.length || 0

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4',
        'animate-float-up',
        className
      )}>
      <div className="glass elevation-3 rounded-2xl p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              {...register('prompt')}
              placeholder="Describe the portrait you want to create..."
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-destructive">{errors.prompt?.message}</span>
              <span
                className={
                  charCount > 500 ? 'text-destructive' : 'text-muted-foreground'
                }>
                {charCount}/500
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
