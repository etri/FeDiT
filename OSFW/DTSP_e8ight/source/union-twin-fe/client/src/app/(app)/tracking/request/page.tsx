import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';
import { trackingAppUrl } from '@/lib/tracking-app';

export default function Page() {
  return (
    <EmbeddedApp
      appId="dataTracking"
      url={trackingAppUrl('/data-tracking')}
      title="트래킹 요청"
    />
  );
}
