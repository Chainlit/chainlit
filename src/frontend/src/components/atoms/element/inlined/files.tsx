import { Stack } from '@mui/material';

import { IFileElement } from 'state/element';

import FileElement from '../file';

interface Props {
  items: IFileElement[];
}

export default function InlinedFileList({ items }: Props) {
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
}
