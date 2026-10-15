'use client';

import MDEditor from '@uiw/react-md-editor';
import { cn } from 'cn';

import { NoticeImage } from '@/app/(app)/noticeboard/_components/NoticeImage';

interface NoticeMarkdownProps {
  source: string;
  className?: string;
}

export function NoticeMarkdown({ source, className }: NoticeMarkdownProps) {
  return (
    <div
      data-color-mode="light"
      className={cn(
        'notice-prose text-foreground w-full',
        '[&_.wmde-markdown]:bg-transparent [&_.wmde-markdown]:font-sans [&_.wmde-markdown]:text-[15px] [&_.wmde-markdown]:leading-7',
        '[&_.wmde-markdown_h1]:mt-8 [&_.wmde-markdown_h1]:mb-4 [&_.wmde-markdown_h1]:border-0 [&_.wmde-markdown_h1]:pb-0 [&_.wmde-markdown_h1]:text-2xl [&_.wmde-markdown_h1]:font-bold [&_.wmde-markdown_h1]:tracking-tight',
        '[&_.wmde-markdown_h2]:mt-7 [&_.wmde-markdown_h2]:mb-3 [&_.wmde-markdown_h2]:border-0 [&_.wmde-markdown_h2]:pb-0 [&_.wmde-markdown_h2]:text-xl [&_.wmde-markdown_h2]:font-semibold',
        '[&_.wmde-markdown_h3]:mt-6 [&_.wmde-markdown_h3]:mb-2 [&_.wmde-markdown_h3]:text-lg [&_.wmde-markdown_h3]:font-semibold',
        '[&_.wmde-markdown_p]:my-4 [&_.wmde-markdown_p]:leading-7',
        '[&_.wmde-markdown_a]:text-primary [&_.wmde-markdown_a]:decoration-primary/40 [&_.wmde-markdown_a]:underline [&_.wmde-markdown_a]:underline-offset-2',
        '[&_.wmde-markdown_ol]:my-4 [&_.wmde-markdown_ol]:list-decimal [&_.wmde-markdown_ol]:pl-6 [&_.wmde-markdown_ul]:my-4 [&_.wmde-markdown_ul]:list-disc [&_.wmde-markdown_ul]:pl-6',
        '[&_.wmde-markdown_li]:my-1.5',
        '[&_.wmde-markdown_blockquote]:border-primary/40 [&_.wmde-markdown_blockquote]:bg-muted/30 [&_.wmde-markdown_blockquote]:text-foreground/80 [&_.wmde-markdown_blockquote]:my-4 [&_.wmde-markdown_blockquote]:rounded-r-md [&_.wmde-markdown_blockquote]:border-l-4 [&_.wmde-markdown_blockquote]:px-4 [&_.wmde-markdown_blockquote]:py-2 [&_.wmde-markdown_blockquote]:italic',
        '[&_.wmde-markdown_code]:bg-muted [&_.wmde-markdown_code]:text-foreground [&_.wmde-markdown_code]:rounded [&_.wmde-markdown_code]:px-1.5 [&_.wmde-markdown_code]:py-0.5 [&_.wmde-markdown_code]:font-mono [&_.wmde-markdown_code]:text-[0.9em] [&_.wmde-markdown_code]:before:content-none [&_.wmde-markdown_code]:after:content-none',
        '[&_.wmde-markdown_pre]:bg-muted/60 [&_.wmde-markdown_pre]:my-4 [&_.wmde-markdown_pre]:overflow-x-auto [&_.wmde-markdown_pre]:rounded-lg [&_.wmde-markdown_pre]:p-4 [&_.wmde-markdown_pre_code]:bg-transparent [&_.wmde-markdown_pre_code]:p-0',
        '[&_.wmde-markdown_hr]:border-border [&_.wmde-markdown_hr]:my-8',
        '[&_.wmde-markdown_th]:bg-muted/40 [&_.wmde-markdown_td]:border-border [&_.wmde-markdown_table]:my-4 [&_.wmde-markdown_table]:w-full [&_.wmde-markdown_table]:overflow-x-auto [&_.wmde-markdown_table]:rounded-md [&_.wmde-markdown_td]:px-3 [&_.wmde-markdown_td]:py-2 [&_.wmde-markdown_th]:px-3 [&_.wmde-markdown_th]:py-2 [&_.wmde-markdown_th]:font-semibold',
        className,
      )}
    >
      <MDEditor.Markdown
        source={source}
        style={{ background: 'transparent', padding: 0 }}
        components={{ img: NoticeImage }}
      />
    </div>
  );
}
