import { cn } from 'cn';

const MIN_LENGTH = 8;
const STRONG_LENGTH = 12;
const BAR_COUNT = 4;

const TIERS = [
  {
    label: '매우 약함',
    barClass: 'bg-destructive',
    labelClass: 'text-destructive',
  },
  { label: '약함', barClass: 'bg-destructive', labelClass: 'text-destructive' },
  { label: '보통', barClass: 'bg-warning', labelClass: 'text-warning' },
  { label: '강함', barClass: 'bg-primary', labelClass: 'text-primary' },
  { label: '매우 강함', barClass: 'bg-primary', labelClass: 'text-primary' },
] as const;

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_LENGTH) score += 1;
  if (/[A-Za-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= STRONG_LENGTH) score += 1;
  return Math.min(score, BAR_COUNT);
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const score = scorePassword(password);
  const tier = TIERS[score] ?? TIERS[0];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score ? tier.barClass : 'bg-muted',
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs', tier.labelClass)}>
        비밀번호 강도: {tier.label}
      </span>
    </div>
  );
}
