import 'server-only';

export function trackingAppUrl(path: '/data-tracking' | '/data-tracking-list') {
  const base = process.env.TRACKING_URL?.replace(/\/$/, '');
  return base ? `${base}${path}` : undefined;
}
