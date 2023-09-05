import { Stack } from '@mui/material';

import { IFileElement } from '../types/element';

import { FileElement } from './File';

interface Props {
  items: IFileElement[];
}

const InlinedFileList = ({ items }: Props) => {
  return (
    <Stack spacing={1} direction="row">
      {items.map((file, i) => {
        return (
          <div key={i}>
            <FileElement element={file} />
          </div>
        );
      })}
    </Stack>
  );
};

export { InlinedFileList };
