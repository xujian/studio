import { z } from 'zod'
import { Mixins } from './types'

export const engineRequestSchema = z.object({
  prompt: z
    .string()
    // .min(1, 'Prompt is required')
    .max(10240, 'Prompt too long (max 10240 characters)'),
  mixins: z
    .object({
      face: z.string().uuid('Invalid moment ID').optional(),
      makeup: z.string().uuid('Invalid moment ID').optional(),
      hair: z.string().uuid('Invalid moment ID').optional(),
      outfit: z.string().uuid('Invalid moment ID').optional(),
      scene: z.string().uuid('Invalid moment ID').optional(),
      lighting: z.string().uuid('Invalid moment ID').optional(),
      camera: z.string().uuid('Invalid moment ID').optional(),
      mood: z.string().uuid('Invalid moment ID').optional(),
    })
    .optional(),
  momentId: z.union([
    z.string().uuid('Invalid moment ID'),
    z.literal('')
  ]).optional(),
  reference: z.string().optional()
})

export type EngineRequest = z.infer<typeof engineRequestSchema>
