function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function getChartColors() {
  return {
    success: readToken('--status-success', '#0f9f6e'),
    fail: readToken('--destructive', '#e11d48'),
    total: readToken('--foreground', '#1f2937'),
    surface: readToken('--card', '#ffffff'),
  } as const;
}
