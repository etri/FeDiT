import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';
import { getRuntimeConfig } from '@/lib/runtime-config';

export default async function Page() {
  const { brokerUrl } = await getRuntimeConfig();

  return (
    <EmbeddedApp
      appId="docsEntity"
      url={brokerUrl ? `${brokerUrl}/swagger-ui/index.html` : undefined}
      title="데이터 조회 API"
    />
  );
}
