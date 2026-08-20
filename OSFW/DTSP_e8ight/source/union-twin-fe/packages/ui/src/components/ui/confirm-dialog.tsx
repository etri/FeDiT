'use client';

import { overlay } from 'overlay-kit';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmDialog({
  isOpen,
  close,
  options,
}: {
  isOpen: boolean;
  close: (result: boolean) => void;
  options: ConfirmOptions;
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title ?? '확인'}</AlertDialogTitle>
          <AlertDialogDescription>{options.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {options.cancelText ?? '취소'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => close(true)}>
            {options.confirmText ?? '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function openConfirmDialog(options: ConfirmOptions): Promise<boolean> {
  return overlay.openAsync<boolean>(({ isOpen, close }) => (
    <ConfirmDialog isOpen={isOpen} close={close} options={options} />
  ));
}
