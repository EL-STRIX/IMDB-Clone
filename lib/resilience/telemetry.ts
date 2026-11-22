export interface RequestTrace {
  url: string;
  durationMs: number;
  status: number;
  retryCount?: number;
  breakerState: string;
}

export function logTrace(trace: RequestTrace): void {
  console.log(
    `[TRACE] ${trace.url} status=${trace.status} duration=${trace.durationMs}ms retries=${trace.retryCount ?? 0} breaker=${trace.breakerState}`
  );
}

export function logErrorTrace(trace: {
  url: string;
  error: any;
  breakerState: string;
}): void {
  console.error(
    `[ERROR TRACE] ${trace.url} failed breaker=${trace.breakerState} message=${trace.error?.message || trace.error}`
  );
}
