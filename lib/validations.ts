import { z } from 'zod'

export const engineRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  mixins: z.object({
    face: z.string().uuid('Invalid face ID').optional()
  }).optional(),
  moment: z.string().uuid('Invalid moment ID').optional()
})

export type EngineRequest = z.infer<typeof engineRequestSchema>
