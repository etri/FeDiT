import { cn } from '@e8ight/ui/utils/cn';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <h1 className="text-foreground text-xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export { PageHeader };
