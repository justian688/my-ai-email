export const TIMEZONE = "Asia/Taipei";

// 台北時區的今天，格式 YYYY-MM-DD
export function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(
    new Date(),
  );
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`${new URL(url).hostname} 回應 HTTP ${res.status}`);
  }
  return res;
}
