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
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import Editor from '@monaco-editor/react';
import { Eye } from 'lucide-react';

import { useCompileTranslatorMutation } from '@/apis/translator';
import { openTranslationPreviewDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslationPreviewDialog';
import { parseTranslatorCode } from '@/app/(app)/service/agents/_utils/translatorSpec';

import type {
  TranslatorCompileRequest,
  TranslatorCompileResponse,
} from '@/apis/translator/translator.types';

const COMPILE_RESULT_MESSAGES: Record<
  number,
  { className?: string; text: string }
> = {
  0: { className: 'text-primary', text: 'Success' },
  1: {
    className: 'text-destructive',
    text: 'Failed compile. Check the error output.',
  },
};

const DEFAULT_COMPILE_MESSAGE = {
  text: 'Error. Please contact the developer.',
};

function CompileResultMessage({ exitCode }: { exitCode: number }) {
  const { className, text } =
    COMPILE_RESULT_MESSAGES[exitCode] ?? DEFAULT_COMPILE_MESSAGE;
  return <span className={className}>{text}</span>;
}

interface CodeEditorPopupProps {
  open: boolean;
  translateCode: string;
  onChangeCode: (value: string) => void;
  translateName: string;
  modelType: string;
  closeCodeEditor: () => void;
  onSuccessCompile: () => void;
  onFailCompile: () => void;
}

function CodeEditorPopup({
  open,
  translateCode,
  onChangeCode,
  translateName,
  modelType,
  closeCodeEditor,
  onSuccessCompile,
  onFailCompile,
}: CodeEditorPopupProps) {
  const [compileResult, setCompileResult] =
    useState<TranslatorCompileResponse>();

  const [responseText, setResponseText] = useState('');
  const compileTranslatorMutation = useCompileTranslatorMutation();

  const onCompileButtonEvent = async () => {
    try {
      const payload: TranslatorCompileRequest = {
        name: translateName,
        translateCode,
      };
      const data = await compileTranslatorMutation.mutateAsync(payload);
      setCompileResult(data);

      const responseText =
        data.exitCode === 0
          ? data.output
          : `${data.output}\n// ==============================|| Error Message ||============================== //\n\n${data.error}`;

      setResponseText(responseText);

      if (data.exitCode === 0) {
        onSuccessCompile();
      } else {
        onFailCompile();
      }
    } catch (error) {
      toast.error(
        'An error has occurred. Please contact the development team.',
      );
      console.error(error);
    }
  };

  const openPreview = () => {
    const { spec, warnings } = parseTranslatorCode(translateCode, modelType);
    void openTranslationPreviewDialog({ spec, warnings });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeCodeEditor()}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Translate Code</DialogTitle>
          <DialogDescription>
            Edit the translator code and compile it to validate the current
            implementation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-auto">
            <Editor
              value={translateCode}
              height="400px"
              language="java"
              className="border-border w-full border"
              onChange={(value) => onChangeCode(value ?? '')}
            />
            <Field>
              <FieldLabel>
                Response
                {compileResult && (
                  <span className="ml-2 text-sm font-normal">
                    <CompileResultMessage exitCode={compileResult.exitCode} />
                  </span>
                )}
              </FieldLabel>
              {compileTranslatorMutation.isPending ? (
                <div className="flex h-full min-h-[240px] w-full items-center justify-center">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <Textarea rows={10} value={responseText} readOnly />
              )}
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="sm:mr-auto"
            onClick={openPreview}
          >
            <Eye />
            출력 미리보기
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={closeCodeEditor}>
              Close
            </Button>
          </DialogClose>
          <Button type="button" onClick={onCompileButtonEvent}>
            Compile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CodeEditorPopup;
