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

import type { FederatedTwin } from '@/apis/dtmeta';
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

function findByName(twins: FederatedTwin[], modelTitle: string) {
  for (const twin of twins) {
    const matched = (twin.federatedDigitalTwinObjects ?? []).find(
      (object) => object.dtoid && object.name === modelTitle,
    );
    if (matched?.dtoid) {
      return toValue(twin.dtid, matched.dtoid);
    }
  }
  return NO_OBJECT;
}

function FederatedTwinObjectDialogBody({
  modelTitle,
  onConfirm,
  onCancel,
}: {
  modelTitle: string;
  onConfirm: (choice: FederatedTwinObjectChoice) => void;
  onCancel: () => void;
}) {
  const { data, isPending, error } = useQuery(dtmetaQueries.federatedTwins());
  const [selected, setSelected] = useState<string>();

  const twins = data?.responseData ?? [];
  const value = selected ?? findByName(twins, modelTitle);

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
                        <span className="text-muted-foreground text-xs">
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
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onConfirm(toChoice(value))}
        >
          Confirm
        </Button>
      </DialogFooter>
    </>
  );
}

export function openFederatedTwinObjectDialog(modelTitle: string) {
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
            modelTitle={modelTitle}
            onConfirm={close}
            onCancel={() => close(undefined)}
          />
        </DialogContent>
      </Dialog>
    ),
  );
}
