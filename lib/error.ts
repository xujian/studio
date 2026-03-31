export const extractError = (err: unknown): { message: string, retryable: boolean } => {
  if (err && typeof err === 'object' && 'status' in err && (err as any).status === 503) {
    return { message: 'Model is currently busy due to high demand. Please try again shortly.', retryable: true }
  }
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) {
    return { message: 'Network error — please check your connection and try again.', retryable: true }
  }
  return { message: 'Generation failed', retryable: false }
}
