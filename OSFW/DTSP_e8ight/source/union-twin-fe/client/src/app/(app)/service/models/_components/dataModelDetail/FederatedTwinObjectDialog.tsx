import { useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';

import { dtmetaQueries } from '@/apis/dtmeta';
import {
  entityAccessUrl,
  modelTypeToDtoid,
} from '@/app/(app)/service/models/_utils/federatedTwinId';

import type { FederatedDigitalTwinObject, FederatedTwin } from '@/apis/dtmeta';
import type { FederatedTwinSyncTarget } from '@/app/(app)/service/models/_utils/syncFederatedTwinSchema';

const NO_OBJECT = 'none';

export type FederatedTwinObjectChoice =
  FederatedTwinSyncTarget | typeof NO_OBJECT;

function toValue(federatedTwinId: string, dtoid: string) {
  return `${federatedTwinId}|${dtoid}`;
}

function toChoice(value: string): FederatedTwinObjectChoice {
  if (value === NO_OBJECT) {
    return NO_OBJECT;
  }
  const [federatedTwinId, dtoid] = value.split('|');
  return { federatedTwinId, dtoid };
}

function findDefault(
  twins: FederatedTwin[],
  modelType: string,
  modelTitle: string,
) {
  const expectedDtoid = modelTypeToDtoid(modelType);
  const matchers = [
    (object: FederatedDigitalTwinObject) => object.dtoid === expectedDtoid,
    (object: FederatedDigitalTwinObject) => object.name === modelTitle,
  ];
  for (const matcher of matchers) {
    for (const twin of twins) {
      const matched = (twin.federatedDigitalTwinObjects ?? []).find(
        (object) => object.dtoid && matcher(object),
      );
      if (matched?.dtoid) {
        return toValue(twin.dtid, matched.dtoid);
      }
    }
  }
  return NO_OBJECT;
}

function FederatedTwinObjectDialogBody({
  modelType,
  modelTitle,
  brokerUrl,
  onConfirm,
  onCancel,
}: {
  modelType: string;
  modelTitle: string;
  brokerUrl: string;
  onConfirm: (choice: FederatedTwinObjectChoice) => void;
  onCancel: () => void;
}) {
  const { data, isPending, error } = useQuery(dtmetaQueries.federatedTwins());
  const [selected, setSelected] = useState<string>();

  const twins = data?.responseData ?? [];
  const value = selected ?? findDefault(twins, modelType, modelTitle);
  const choice = toChoice(value);

  return (
    <>
      {isPending && (
        <div className="flex justify-center py-6">
          <Spinner className="size-6" />
        </div>
      )}
      {error && (
        <p className="text-destructive text-sm">
          Failed to load federated digital twins. {error.message}
        </p>
      )}
      {data && (
        <Select value={value} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_OBJECT}>Do not update any object</SelectItem>
            {twins.map((twin) => (
              <SelectGroup key={twin.dtid}>
                <SelectLabel>
                  {twin.name} ({twin.dtid})
                </SelectLabel>
                {(twin.federatedDigitalTwinObjects ?? []).map(
                  (object) =>
                    object.dtoid && (
                      <SelectItem
                        key={object.dtoid}
                        value={toValue(twin.dtid, object.dtoid)}
                      >
                        {object.name}
                        <span
                          className="text-muted-foreground min-w-0 truncate text-xs"
                          title={object.dtoid}
                        >
                          {object.dtoid}
                        </span>
                      </SelectItem>
                    ),
                )}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
      {choice !== NO_OBJECT && (
        <p className="text-muted-foreground text-xs wrap-anywhere">
          dataAccessURL은{' '}
          <code className="font-mono">
            {entityAccessUrl(brokerUrl, modelType, choice.dtoid)}
          </code>
          로 등록되며(토큰·헤더 없이 조회 가능), 이 모델로 수집이 시작된 뒤부터
          조회됩니다.
        </p>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onConfirm(choice)}
        >
          Confirm
        </Button>
      </DialogFooter>
    </>
  );
}

export function openFederatedTwinObjectDialog({
  modelType,
  modelTitle,
  brokerUrl,
}: {
  modelType: string;
  modelTitle: string;
  brokerUrl: string;
}) {
  return overlay.openAsync<FederatedTwinObjectChoice | undefined>(
    ({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close(undefined)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change status to Ready</DialogTitle>
            <DialogDescription>
              Pick the federated digital twin object that receives this
              model&apos;s schemaInformation. Pending edits will be reset.
            </DialogDescription>
          </DialogHeader>
          <FederatedTwinObjectDialogBody
            modelType={modelType}
            modelTitle={modelTitle}
            brokerUrl={brokerUrl}
            onConfirm={close}
            onCancel={() => close(undefined)}
          />
        </DialogContent>
      </Dialog>
    ),
  );
}
