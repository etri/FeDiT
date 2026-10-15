import { useId, useState } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@e8ight/ui/components/ui/alert';
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
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { useTestTranslatorMutation } from '@/apis/translator';

import type { TranslatorTestResponse } from '@/apis/translator';
import type { ApiError } from '@/types/error';

function toErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const errorResponse = error.response?.data as ApiError | undefined;
    return errorResponse?.detail ?? error.message;
  }
  return error instanceof Error ? error.message : '테스트 요청에 실패했습니다.';
}

function TestResultAlert({ response }: { response: TranslatorTestResponse }) {
  if (response.success) {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>변환 및 모델 검증 성공</AlertTitle>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>
        {response.result == null ? '변환 실패' : '모델 검증 실패'}
      </AlertTitle>
      <AlertDescription>
        <pre className="max-h-40 w-full overflow-auto font-mono text-xs whitespace-pre-wrap">
          {response.message}
        </pre>
      </AlertDescription>
    </Alert>
  );
}

interface TranslatorTestBodyProps {
  translatorId: number;
}

function TranslatorTestBody({ translatorId }: TranslatorTestBodyProps) {
  const sampleId = useId();
  const [sample, setSample] = useState('');
  const [parseError, setParseError] = useState<string>();
  const testMutation = useTestTranslatorMutation();

  function handleRun() {
    let sampleJson: string;
    try {
      sampleJson = JSON.stringify(JSON.parse(sample));
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : '원천 JSON을 읽지 못했습니다.',
      );
      return;
    }
    setParseError(undefined);
    testMutation.mutate({ translatorId, payload: { sampleJson } });
  }

  const response = testMutation.data;

  return (
    <>
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
        <Field data-invalid={!!parseError}>
          <FieldLabel htmlFor={sampleId}>원천 데이터 (JSON 1건)</FieldLabel>
          <Textarea
            id={sampleId}
            rows={16}
            className="font-mono text-xs"
            placeholder='{ "id": 1, "title": "..." }'
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            aria-invalid={!!parseError}
          />
          {parseError && <FieldError>{parseError}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>변환 결과 (첫 번째 엔티티)</FieldLabel>
          <pre className="bg-muted/40 border-border min-h-[calc(16lh+1rem)] overflow-auto rounded-md border p-3 font-mono text-xs leading-5 whitespace-pre">
            {testMutation.isPending ? (
              <Spinner className="size-6" />
            ) : response?.result != null ? (
              JSON.stringify(response.result, null, 2)
            ) : (
              '실행을 누르면 저장된 translator 코드를 서버에서 실행합니다.'
            )}
          </pre>
        </Field>
      </div>
      {testMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>테스트 요청 실패</AlertTitle>
          <AlertDescription>
            {toErrorMessage(testMutation.error)}
          </AlertDescription>
        </Alert>
      )}
      {response && <TestResultAlert response={response} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            닫기
          </Button>
        </DialogClose>
        <Button
          type="button"
          onClick={handleRun}
          disabled={testMutation.isPending}
        >
          {testMutation.isPending ? <Spinner className="size-4" /> : <Play />}
          실행
        </Button>
      </DialogFooter>
    </>
  );
}

interface OpenTranslatorTestDialogParams {
  translatorId: number;
  translatorName: string;
}

export function openTranslatorTestDialog({
  translatorId,
  translatorName,
}: OpenTranslatorTestDialogParams) {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{translatorName} 출력 테스트</DialogTitle>
          <DialogDescription>
            저장된 translator 코드를 서버에서 실제로 실행한 결과입니다. 코드를
            수정했다면 먼저 저장해야 반영됩니다.
          </DialogDescription>
        </DialogHeader>
        <TranslatorTestBody translatorId={translatorId} />
      </DialogContent>
    </Dialog>
  ));
}
