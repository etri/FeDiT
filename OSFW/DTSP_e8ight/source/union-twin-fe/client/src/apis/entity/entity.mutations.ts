import { useMutation, useQueryClient } from '@tanstack/react-query';

import { entityKeys } from '@/apis/entity/entity.queries';
import { postEntity } from '@/apis/entity/entityApi';

export function usePostEntityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
}
