// src/arkiv/time.ts
export function computeExpiresInFromDeadline(
  deadline?: string
): number | undefined {
  if (!deadline) return undefined;
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diffMs = dl - now;
  if (diffMs <= 0) {
    // Si ya se venció, dejalo vivo un ratito para demo
    return 60 * 10;
  }
  return Math.floor(diffMs / 1000);
}
