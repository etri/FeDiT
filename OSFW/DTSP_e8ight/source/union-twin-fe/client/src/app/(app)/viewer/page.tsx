import { Suspense } from 'react';

import { ViewerContent } from '@/app/(app)/viewer/_components/ViewerContent';

export default function Page() {
  return (
    <Suspense>
      <ViewerContent />
    </Suspense>
  );
}
