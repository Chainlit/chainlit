
import React, { forwardRef } from 'react';
import { FileSpec, useConfig } from '@chainlit/react-client';
import { PaperClip } from '@/components/icons/PaperClip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';
import { useUpload } from '@/hooks/useUpload';

interface UploadButtonProps {
  disabled?: boolean;
  fileSpec: FileSpec;
  onFileUpload: (files: File[]) => void;
  onFileUploadError: (error: string) => void;
}

export const UploadButton = forwardRef<HTMLSpanElement, UploadButtonProps>(
  ({ disabled = false, fileSpec, onFileUpload, onFileUploadError }, ref) => {
    const { config } = useConfig();
    const upload = useUpload({
      spec: fileSpec,
      onResolved: (payloads: File[]) => onFileUpload(payloads),
      onError: onFileUploadError,
      options: { noDrag: true }
    });

    if (!upload || !config?.features.spontaneous_file_upload?.enabled) return null;
    const { getRootProps, getInputProps } = upload;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span ref={ref} className="inline-block">
              <input
                id="upload-button-input"
                className="hidden"
                {...getInputProps()}
              />
              <Button
                id={disabled ? 'upload-button-loading' : 'upload-button'}
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
                disabled={disabled}
                {...getRootProps()}
                type="button"
              >
                <PaperClip className="!size-6" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {/* CORRECTION : On utilise <div> au lieu de <p> ici */}
            <div className="text-sm">
              <Translator path="chat.input.actions.attachFiles" />
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

UploadButton.displayName = 'UploadButton';
export default UploadButton;