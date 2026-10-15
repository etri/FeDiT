import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { cn } from 'cn';

interface StatusOverlayProps {
  isVisible: boolean;
  text?: string;
  blur?: boolean;
  className?: string;
}

function StatusOverlay({
  isVisible,
  text = '로딩 중...',
  blur = false,
  className,
}: StatusOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-background/80 absolute inset-0 z-50 flex items-center justify-center p-4',
        blur && 'backdrop-blur-xs',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner className="text-primary size-10" />
        <p className="text-foreground text-sm">{text}</p>
      </div>
    </div>
  );
}

export { StatusOverlay };
