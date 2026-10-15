import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';
import { getRuntimeConfig } from '@/lib/runtime-config';

export default async function Page() {
  const { predictorUrl } = await getRuntimeConfig();

  return (
    <EmbeddedApp
      appId="predictor"
      url={predictorUrl || undefined}
      title="predictor"
    />
  );
}
