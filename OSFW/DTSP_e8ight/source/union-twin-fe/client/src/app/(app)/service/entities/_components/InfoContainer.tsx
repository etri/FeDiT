import type React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@e8ight/ui/components/ui/breadcrumb';
import { Separator } from '@e8ight/ui/components/ui/separator';

interface IProps {
  title: string;
  path: string[];
  children: React.ReactNode;
}

function InfoContainer({ title, path, children }: IProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-2 pb-2">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-foreground text-sm font-bold tracking-[.03em]">
            {title}
          </h2>
          {path.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap gap-1 text-xs">
                {path.map((item, idx) => (
                  <span key={item + String(idx)} className="contents">
                    {idx > 0 && <BreadcrumbSeparator className="mx-1" />}
                    <BreadcrumbItem className="text-muted-foreground min-w-0 text-xs">
                      {idx === path.length - 1 ? (
                        <BreadcrumbPage className="max-w-[260px] truncate text-xs font-medium">
                          {item}
                        </BreadcrumbPage>
                      ) : (
                        <span className="max-w-[220px] truncate">{item}</span>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden pt-2">
        {children}
      </div>
    </section>
  );
}

export default InfoContainer;
