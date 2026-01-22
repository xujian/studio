'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { promptSchema, type PromptInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

type PromptFormProps = {
  onSubmit: (data: PromptInput) => void
  isLoading: boolean
  defaultValue?: string
}

export const PromptForm = ({ onSubmit, isLoading, defaultValue }: PromptFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromptInput>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: defaultValue || '',
    },
  })

  const prompt = watch('prompt')
  const charCount = prompt?.length || 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          {...register('prompt')}
          placeholder="Describe the portrait you want to create..."
          className="min-h-[200px] resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-destructive">
            {errors.prompt?.message}
          </span>
          <span className={charCount > 500 ? 'text-destructive' : 'text-muted-foreground'}>
            {charCount}/500
          </span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
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
  )
}
