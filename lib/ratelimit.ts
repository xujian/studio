import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 10 generations per hour per user
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'studio:photo',
})
