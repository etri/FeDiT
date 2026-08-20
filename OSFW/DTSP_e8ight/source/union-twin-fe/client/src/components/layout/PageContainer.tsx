import { cn } from '@e8ight/ui/utils/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'text-foreground flex w-full flex-col gap-6 p-4 md:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export { PageContainer };
