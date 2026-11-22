export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 300;
  const maxDelay = options.maxDelayMs ?? 3000;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      const status = error?.status || error?.statusCode;
      const isRateLimit = status === 429;
      const isServerError = status >= 500 && status < 600;
      const isNetworkError = !status;

      const shouldRetry = isRateLimit || isServerError || isNetworkError;
      if (!shouldRetry) {
        throw error;
      }

      // Check Retry-After header in seconds
      let delayMs: number;
      const retryAfterHeader = error?.headers?.get?.("retry-after") || error?.retryAfter;
      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10);
        delayMs = isNaN(parsed) ? initialDelay : parsed * 1000;
      } else {
        // Exponential backoff with deterministic attempt-based jitter (avoids Math.random during prerender)
        const backoff = initialDelay * Math.pow(2, attempt - 1);
        const jitter = (attempt * 37) % 100;
        delayMs = Math.min(backoff + jitter, maxDelay);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
