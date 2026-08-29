export function isRetryableEmailError(
  error: unknown,
): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const message =
    error.message.toLowerCase();

  const retryablePatterns = [
    "timeout",
    "timed out",
    "connection",
    "econnreset",
    "econnrefused",
    "temporary",
    "network",
    "421",
    "450",
    "451",
    "452",
  ];

  return retryablePatterns.some(
    (pattern) =>
      message.includes(pattern),
  );
}