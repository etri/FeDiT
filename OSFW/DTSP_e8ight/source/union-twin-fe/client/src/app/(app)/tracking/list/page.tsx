import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';
import { trackingAppUrl } from '@/lib/tracking-app';

export default function Page() {
  return (
    <EmbeddedApp
      appId="dataTrackingList"
      url={trackingAppUrl('/data-tracking-list')}
      title="트래킹 요청 목록"
    />
  );
}
