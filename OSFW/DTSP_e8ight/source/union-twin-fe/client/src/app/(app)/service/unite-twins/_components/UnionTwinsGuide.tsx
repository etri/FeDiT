import { cn } from '@e8ight/ui/utils/cn';

const STEPS = [
  { step: 1, text: '메타데이터에서 통합할 단일 트윈을 담습니다' },
  { step: 2, text: '왼쪽 목록에서 묶을 트윈을 선택합니다' },
  { step: 3, text: '오른쪽에 정보를 입력해 연합 트윈을 생성합니다' },
] as const;

export function UnionTwinsGuide() {
  return (
    <div className="border-border bg-muted/30 flex shrink-0 flex-col gap-2.5 rounded-lg border px-4 py-3 lg:flex-row lg:items-center lg:gap-5">
      <p className="text-foreground shrink-0 text-sm">
        <span className="text-foreground font-bold">단일 트윈 통합</span> — 여러
        단일 트윈을 하나의 연합 트윈으로 묶어 관리합니다.
      </p>
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-4">
        {STEPS.map(({ step, text }) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'bg-primary text-primary-foreground flex size-5 shrink-0',
                'items-center justify-center rounded-full font-bold',
              )}
            >
              {step}
            </span>
            <span className="text-muted-foreground text-xs">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
