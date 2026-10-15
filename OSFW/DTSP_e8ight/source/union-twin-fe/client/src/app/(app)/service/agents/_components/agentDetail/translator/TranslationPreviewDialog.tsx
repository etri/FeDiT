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
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import { AlertTriangle, Play } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { simulateTranslation } from '@/app/(app)/service/agents/_utils/simulateTranslation';

import type { SimulationResult } from '@/app/(app)/service/agents/_utils/simulateTranslation';
import type { TranslatorSpec } from '@/app/(app)/service/agents/_utils/translatorSpec';

interface TranslationPreviewBodyProps {
  spec: TranslatorSpec;
  warnings: string[];
  initialSample: string;
}

function TranslationPreviewBody({
  spec,
  warnings,
  initialSample,
}: TranslationPreviewBodyProps) {
  const sampleId = useId();
  const [sample, setSample] = useState(initialSample);
  const [parseError, setParseError] = useState<string>();
  const [result, setResult] = useState<SimulationResult>();

  function handleRun() {
    try {
      const parsed: unknown = JSON.parse(sample);
      setParseError(undefined);
      setResult(simulateTranslation(spec, parsed));
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : '원천 JSON을 읽지 못했습니다.',
      );
      setResult(undefined);
    }
  }

  const allWarnings = [...warnings, ...(result?.warnings ?? [])];

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
          <FieldLabel>예상 NGSI-LD 엔티티</FieldLabel>
          <pre className="bg-muted/40 border-border min-h-[calc(16lh+1rem)] overflow-auto rounded-md border p-3 font-mono text-xs leading-5 whitespace-pre">
            {result
              ? JSON.stringify(result.entities, null, 2)
              : '실행을 누르면 현재 매핑 기준으로 변환 결과를 계산합니다.'}
          </pre>
        </Field>
      </div>
      {allWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>확인이 필요한 항목 {allWarnings.length}건</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {allWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            닫기
          </Button>
        </DialogClose>
        <Button type="button" onClick={handleRun}>
          <Play />
          실행
        </Button>
      </DialogFooter>
    </>
  );
}

interface OpenTranslationPreviewDialogParams {
  spec: TranslatorSpec;
  warnings?: string[];
  sample?: string;
}

export function openTranslationPreviewDialog({
  spec,
  warnings = [],
  sample = '',
}: OpenTranslationPreviewDialogParams) {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>출력 미리보기</DialogTitle>
          <DialogDescription>
            코드에서 추출한 매핑을 원천 데이터에 적용해 계산한 예상 결과입니다.
            서버에서 실제 Java 코드를 실행한 결과가 아니므로 손으로 추가한
            로직은 반영되지 않습니다.
          </DialogDescription>
        </DialogHeader>
        <TranslationPreviewBody
          spec={spec}
          warnings={warnings}
          initialSample={sample}
        />
      </DialogContent>
    </Dialog>
  ));
}
