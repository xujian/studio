export const extractError = (err: unknown): { message: string, retryable: boolean } => {
  if (err && typeof err === 'object' && 'status' in err && (err as any).status === 503) {
    return { message: 'Model is currently busy due to high demand. Please try again shortly.', retryable: true }
  }
  return { message: 'Generation failed', retryable: false }
}
