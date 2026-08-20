import { useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import axios from 'axios';
import { Code, Pencil, Trash2 } from 'lucide-react';

import { useDeleteTranslatorMutation } from '@/apis/translator';
import CodeViewerPopup from '@/app/(app)/service/agents/_components/agentDetail/translator/CodeViewerPopup';
import { isTranslatorRunning } from '@/app/(app)/service/agents/_components/agentDetail/translator/translatorStatus';
import { convertFullDateTimeFromString } from '@/lib/date';

import type { TranslatorType } from '@/apis/translator/translator.types';
import type { ApiError } from '@/types/error';

interface TranslatorDetailProps {
  translator: TranslatorType;
  isEdit: boolean;
  onChangeIsEdit: () => void;
}

function TranslatorDetail({
  translator,
  isEdit,
  onChangeIsEdit,
}: TranslatorDetailProps) {
  const [codeViewerToggle, setCodeViewerToggle] = useState(false);
  const [sourceTopic, setSourceTopic] = useState(translator.sourceTopic);

  const deleteTranslatorMutation = useDeleteTranslatorMutation();

  const handleDelete = async () => {
    if (isTranslatorRunning(translator.status)) {
      toast.error('Please stop the translator before deleting.');
      return;
    }
    const confirmed = await openConfirmDialog({
      title: 'Confirm Delete',
      message: `Delete "${translator.name}"?`,
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteTranslatorMutation.mutateAsync(translator.id);
      toast.success('Translator deleted.');
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response?.data as ApiError | undefined;
        toast.error(errorResponse?.detail ?? 'Please try again.');
      }
    }
  };

  return (
    <div className="border-border border-t px-4 py-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={translator.name} readOnly />
          </Field>
          <Field>
            <FieldLabel>Model Type</FieldLabel>
            <Input value={translator.modelType} readOnly />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel>ID</FieldLabel>
            <Input value={String(translator.id)} readOnly />
          </Field>
          <Field>
            <FieldLabel>Agent ID</FieldLabel>
            <Input value={String(translator.agentId)} readOnly />
          </Field>
          <Field>
            <FieldLabel>PID</FieldLabel>
            <Input
              value={translator.pid === null ? '-' : String(translator.pid)}
              readOnly
            />
          </Field>
          <Field>
            <FieldLabel>Last Translation</FieldLabel>
            <Input
              value={
                translator.lastSignalDatetime
                  ? convertFullDateTimeFromString(translator.lastSignalDatetime)
                  : '-'
              }
              readOnly
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Source Topic</FieldLabel>
          {isEdit ? (
            <Input
              value={sourceTopic}
              onChange={(e) => setSourceTopic(e.target.value)}
            />
          ) : (
            <Input value={translator.sourceTopic || '-'} readOnly />
          )}
        </Field>

        <Field>
          <FieldLabel>Translate Code</FieldLabel>
          <div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCodeViewerToggle(true)}
            >
              <Code className="size-3.5" />
              {isEdit ? 'Edit Code' : 'View Code'}
            </Button>
          </div>
        </Field>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-end gap-2">
        {isEdit ? (
          <>
            <Button size="sm" variant="outline" onClick={onChangeIsEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={onChangeIsEdit}>
              Save
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={onChangeIsEdit}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={handleDelete}
              disabled={deleteTranslatorMutation.isPending}
            >
              {deleteTranslatorMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  Delete
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <CodeViewerPopup
        open={codeViewerToggle}
        translateCode={translator.translateCode}
        closeCodeViewer={() => setCodeViewerToggle(false)}
      />
    </div>
  );
}

export default TranslatorDetail;
