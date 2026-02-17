import React, { useEffect, useMemo } from 'react';
import { DefaultExtensionType, FileIcon, defaultStyles } from 'react-file-icon';

import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface AttachmentProps {
  name: string;
  mime: string;
  children?: React.ReactNode;
  file?: File;
}

const Attachment: React.FC<AttachmentProps> = ({
  name,
  mime,
  children,
  file
}) => {
  const isImage = useMemo(() => mime.startsWith('image/'), [mime]);
  const imageUrl = useMemo(() => {
    if (isImage && file) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, [isImage, file]);

  // Cleanup Object URL on unmount or when imageUrl changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  let extension: DefaultExtensionType;
  if (name.includes('.')) {
    extension = name.split('.').pop()!.toLowerCase() as DefaultExtensionType;
  } else {
    extension = mime
      ? ((mime.split('/').pop() || 'txt') as DefaultExtensionType)
      : ('txt' as DefaultExtensionType);
  }

  if (isImage && imageUrl) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative h-[58px] w-[58px]">
              {children}
              <Card className="h-full p-1 flex items-center justify-center rounded-lg border overflow-hidden">
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              </Card>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative h-[58px]">
            {children}
            <Card className="h-full p-2 flex flex-row items-center gap-3 rounded-lg w-full max-w-[200px] border">
              <div className="w-10">
                <FileIcon {...defaultStyles[extension]} extension={extension} />
              </div>
              <span className="truncate w-[80%] font-medium text-sm font-medium">
                {name}
              </span>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { Attachment };
