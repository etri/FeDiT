'use client';

import { useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Download, FileArchive } from 'lucide-react';

import { getDownloadFiles, getLogicalFilesUFID } from '@/apis/ndxpro';
import { StatusOverlay } from '@/components/common/StatusOverlay';

const FILENAME = 'DTEditor.zip';

export function DownloadCard() {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    try {
      setIsDownloading(true);
      setProgress(10);

      const ufidData = await getLogicalFilesUFID(FILENAME);
      setProgress(30);

      const ufid = ufidData?.list[0]?.ufId;
      if (!ufid) {
        throw new Error('File not found');
      }

      const response = await getDownloadFiles(ufid, {
        onDownloadProgress: (progressEvent: {
          total?: number;
          loaded: number;
        }) => {
          if (!progressEvent.total) {
            return;
          }
          const currentProgress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setProgress(Math.min(100, Math.round(30 + currentProgress * 0.7)));
        },
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', FILENAME);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download the file', error);
      toast.error('파일을 다운로드하는 데 문제가 발생했습니다.');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  }

  return (
    <>
      <div>
        <div className="border-border flex items-center justify-center rounded-lg border p-7">
          <FileArchive className="size-[60px]" />
        </div>
        <Button
          type="button"
          onClick={handleDownload}
          className="mt-3 flex w-full items-center gap-1"
          disabled={isDownloading}
        >
          <Download className="size-4" />
          {isDownloading ? '다운로드 중...' : '사용하기'}
        </Button>
      </div>

      <StatusOverlay
        isVisible={isDownloading}
        text={`다운로드 중... ${progress}%`}
        blur
      />
    </>
  );
}
