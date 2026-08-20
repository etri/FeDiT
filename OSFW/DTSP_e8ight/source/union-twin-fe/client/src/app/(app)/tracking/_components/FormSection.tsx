'use client';

import type { ReactNode } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function FormSection({ title, children, defaultOpen }: FormSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-3">
      <CollapsibleTrigger className="text-foreground hover:text-foreground/80 group flex w-full items-center gap-2 text-sm font-bold">
        <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
        <span>{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default FormSection;
