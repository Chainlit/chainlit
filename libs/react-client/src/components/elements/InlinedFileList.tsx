import type { IFileElement } from 'src/types';

import Stack from '@mui/material/Stack';

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
