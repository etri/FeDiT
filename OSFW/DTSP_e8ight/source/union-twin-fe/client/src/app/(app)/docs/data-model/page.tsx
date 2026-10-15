import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';
import { getRuntimeConfig } from '@/lib/runtime-config';

export default async function Page() {
  const { managerUrl } = await getRuntimeConfig();

  return (
    <EmbeddedApp
      appId="docsDataModel"
      url={managerUrl ? `${managerUrl}/swagger-ui.html` : undefined}
      title="데이터 모델 API"
    />
  );
}
