import React from 'react';

import Stack from '@mui/material/Stack';

import { FileElement } from './elements';
import { IFileElement } from './types';

interface AttachmentsProps {
  fileElements: IFileElement[];
  setFileElements: React.Dispatch<React.SetStateAction<IFileElement[]>>;
}

const Attachments = ({
  fileElements,
  setFileElements
}: AttachmentsProps): JSX.Element => {
  if (fileElements.length === 0) return <></>;

  const onRemove = (index: number) => {
    setFileElements((prev) =>
      prev.filter((_, prevIndex) => index !== prevIndex)
    );
  };

  return (
    <Stack
      id="attachments"
      sx={{
        flexDirection: 'row',
        gap: 2,
        width: 'fit-content',
        flexWrap: 'wrap'
      }}
    >
      {fileElements.map((fileElement, index) => {
        return (
          <FileElement
            key={index}
            element={fileElement}
            onRemove={() => onRemove(index)}
          />
        );
      })}
    </Stack>
  );
};

export { Attachments };
