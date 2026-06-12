
import React, { useEffect, useState, useMemo } from 'react';
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
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const isImage = mime.startsWith('image/');

  useEffect(() => {
    if (isImage && file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  // Extraction propre de l'extension pour react-file-icon
  const extension = useMemo(() => {
    const ext = name.includes('.') 
      ? name.split('.').pop()?.toLowerCase() 
      : (mime?.split('/').pop() || 'txt');
    return ext as DefaultExtensionType;
  }, [name, mime]);

  const renderContent = () => (
    <div className="relative h-[58px] w-full flex items-center justify-center">
      {children}
      {isImage && imageUrl ? (
        <Card className="h-[58px] w-[58px] p-1 flex items-center justify-center rounded-lg border overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        </Card>
      ) : (
        <Card className="h-full p-2 flex flex-row items-center gap-3 rounded-lg w-full max-w-[200px] border bg-card">
          <div className="w-8 shrink-0">
            <FileIcon 
              extension={extension} 
              {...(defaultStyles[extension] || defaultStyles.txt)} 
            />
          </div>
          <span className="truncate flex-1 font-medium text-xs">
            {name}
          </span>
        </Card>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={isImage && imageUrl ? "w-[58px]" : "w-fit"}>
            {renderContent()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs font-sans">{name}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { Attachment };