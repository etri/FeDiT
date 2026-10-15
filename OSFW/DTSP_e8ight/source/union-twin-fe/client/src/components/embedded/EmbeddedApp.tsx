'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { cn } from 'cn';
import {
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

import { useEmbeddedAppStatus } from '@/components/embedded/useEmbeddedAppStatus';
import { getEmbeddedApp } from '@/lib/iframe/registry';

import type { EmbeddedAppConfig, EmbeddedAppId } from '@/lib/iframe/types';

interface EmbeddedAppProps {
  appId: EmbeddedAppId;
  url?: string;
  params?: Record<string, string>;
  title?: string;
  className?: string;
  onLoad?: () => void;
}

export function EmbeddedApp({
  appId,
  url,
  params,
  title,
  className,
  onLoad,
}: EmbeddedAppProps) {
  const config = getEmbeddedApp(appId, url);
  const src = buildSrc(config, params);

  const {
    status,
    reloadKey,
    onLoad: handleLoad,
    onError: handleError,
    retry,
  } = useEmbeddedAppStatus(src, onLoad);

  const isLoading = status === 'checking' || status === 'loading';
  const isBlocked = status === 'blocked';
  const isErrored = status === 'error';

  const fallback = isBlocked
    ? {
        icon: <ShieldAlert />,
        title: '보안 정책으로 페이지를 표시할 수 없습니다',
        description:
          '해당 서비스가 HTTP로 제공되어 HTTPS 화면 안에 표시할 수 없습니다. 새 탭에서 열어 이용해주세요.',
        action: (
          <Button variant="outline" asChild>
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />새 탭에서 열기
            </a>
          </Button>
        ),
      }
    : {
        icon: <AlertTriangle />,
        title: config.errorTitle ?? '페이지를 불러올 수 없습니다',
        description:
          config.errorMessage ??
          '서비스에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.',
        action: (
          <Button variant="outline" onClick={retry}>
            <RefreshCw className="size-4" />
            다시 시도
          </Button>
        ),
      };

  return (
    <div className={cn('relative size-full', className)}>
      {status === 'checking' || isBlocked ? null : (
        <iframe
          key={reloadKey}
          src={src}
          title={title ?? appId}
          className="size-full"
          sandbox={config.sandbox}
          allow={config.allow}
          referrerPolicy={config.referrerPolicy}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {isLoading ? (
        <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
          <Spinner className="text-muted-foreground size-6" />
          <p className="text-muted-foreground text-sm">불러오는 중…</p>
        </div>
      ) : null}
      {isBlocked || isErrored ? (
        <div className="bg-background absolute inset-0 z-10 flex items-center justify-center p-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">{fallback.icon}</EmptyMedia>
              <EmptyTitle>{fallback.title}</EmptyTitle>
              <EmptyDescription>{fallback.description}</EmptyDescription>
            </EmptyHeader>
            {fallback.action}
          </Empty>
        </div>
      ) : null}
    </div>
  );
}

function buildSrc(
  config: EmbeddedAppConfig,
  params?: Record<string, string>,
): string {
  const qs = Object.entries(params ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  if (!qs) return config.url;
  const sep = config.url.includes('?') ? '&' : '?';
  return `${config.url}${sep}${qs}`;
}
