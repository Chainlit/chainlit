import React from 'react';
import { DefaultExtensionType, FileIcon, defaultStyles } from 'react-file-icon';

import { Card } from '@/components/ui/card';

interface AttachmentProps {
  name: string;
  mime: string;
  children?: React.ReactNode;
}

const Attachment: React.FC<AttachmentProps> = ({ name, mime, children }) => {
  const extension = (
    mime ? mime.split('/').pop() : 'txt'
  ) as DefaultExtensionType;

  return (
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
  );
};

export { Attachment };
