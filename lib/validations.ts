import { z } from 'zod'

export const promptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be less than 500 characters'),
})

export type PromptInput = z.infer<typeof promptSchema>
