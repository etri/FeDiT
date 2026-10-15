import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dtmetaKeys } from '@/apis/dtmeta/dtmeta.queries';
import { putFederatedTwinObjects } from '@/apis/dtmeta/dtmetaApi';
import { fdtSyncKeys } from '@/apis/fdtSync';

import type { CreateFederatedTwinObjectPayload } from '@/apis/dtmeta/dtmeta.types';

export function useCreateFederatedTwinObjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFederatedTwinObjectPayload) =>
      putFederatedTwinObjects(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dtmetaKeys.all });
      queryClient.invalidateQueries({ queryKey: fdtSyncKeys.all });
    },
  });
}
