'use client';

import { useIsMobile } from '@e8ight/ui/hooks';
import MDEditor, { commands } from '@uiw/react-md-editor';

import type { ICommand } from '@uiw/react-md-editor';

const TOOLBAR_COMMANDS: ICommand[] = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title,
  commands.divider,
  commands.link,
  commands.quote,
  commands.code,
  commands.codeBlock,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.checkedListCommand,
];

interface NoticeContentEditorProps {
  value: string;
  onChange: (next: string) => void;
  textareaId: string;
}

export function NoticeContentEditor({
  value,
  onChange,
  textareaId,
}: NoticeContentEditorProps) {
  const isMobile = useIsMobile();

  return (
    <div
      data-color-mode="light"
      className="relative overflow-hidden rounded-lg border max-md:[&_.w-md-editor-toolbar_li>button]:inline-flex max-md:[&_.w-md-editor-toolbar_li>button]:!size-9 max-md:[&_.w-md-editor-toolbar_li>button]:items-center max-md:[&_.w-md-editor-toolbar_li>button]:justify-center"
    >
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? '')}
        height={560}
        preview={isMobile ? 'edit' : 'live'}
        visibleDragbar={false}
        commands={TOOLBAR_COMMANDS}
        textareaProps={{ id: textareaId }}
      />
    </div>
  );
}
