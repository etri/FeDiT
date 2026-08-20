'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import { Card, CardContent } from '@e8ight/ui/components/ui/card';
import { GitFork, Link } from 'lucide-react';

interface GitHubLinkCardProps {
  label: string;
  link: string;
  description?: string;
}

export function GitHubLinkCard({
  label,
  link,
  description,
}: GitHubLinkCardProps) {
  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardContent className="flex gap-3 p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border rounded-md border p-3">
            <GitFork className="size-16" />
          </div>
          <Button
            size="sm"
            onClick={() => window.open(link, '_blank')}
            className="w-24 gap-2"
          >
            <Link className="size-3" />
            GitHub
          </Button>
        </div>
        <div className="mt-3 min-w-0">
          <p className="text-foreground mb-6 text-sm font-bold tracking-[.03em]">
            {label}
          </p>
          {description && (
            <p className="text-muted-foreground mb-4 text-xs">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
