import { X } from 'lucide-react';
import React from 'react';
import { useRecoilValue } from 'recoil';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { attachmentsState } from '@/state/chat';

import { Attachment } from './Attachment';

const CircularProgressButton = ({
  progress,
  onClick,
  children
}: {
  progress: number;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const size = 24; // 6 * 4 (w-6 = 1.5rem = 24px)
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="absolute"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="text-muted-foreground/20"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
        />
        <circle
          className="text-primary transition-all duration-300 ease-in-out"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Button
        size="icon"
        className="w-6 h-6 rounded-full bg-card hover:bg-card text-foreground"
        onClick={onClick}
      >
        {children}
      </Button>
    </div>
  );
};
const Attachments = () => {
  const attachments = useRecoilValue(attachmentsState);

  if (attachments.length === 0) return null;

  return (
    <div id="attachments" className="flex flex-row flex-wrap gap-4 w-fit">
      {attachments.map((attachment) => {
        const showProgress = !attachment.uploaded && attachment.cancel;

        const progress = showProgress ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -right-2 -top-2">
                  <CircularProgressButton
                    progress={attachment.uploadProgress || 0}
                    onClick={() => attachment.cancel?.()}
                  >
                    <X className="!size-3" />
                  </CircularProgressButton>
                </div>
              </TooltipTrigger>
              <TooltipContent>Cancel upload</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null;

        const remove =
          !showProgress && attachment.remove ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute -right-2 -top-2">
                    <Button
                      size="icon"
                      className="w-6 h-6 shadow-sm rounded-full border-4 bg-card hover:bg-card text-foreground light:border-muted"
                      onClick={attachment.remove}
                    >
                      <X className="!size-3" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Remove attachment</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null;

        return (
          <Attachment
            key={attachment.id}
            name={attachment.name}
            mime={attachment.type}
          >
            {progress}
            {remove}
          </Attachment>
        );
      })}
    </div>
  );
};

export { Attachments };
