import 'server-only';

export function ndxproUpstream() {
  const host = process.env.NDXPRO_API_URL;
  if (!host) throw new Error('NDXPRO_API_URL is not set');

  const token = process.env.NDXPRO_TOKEN;
  if (!token) throw new Error('NDXPRO_TOKEN is not set');

  return { baseUrl: `${host}/ndxpro/v1`, token };
}
