import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';

import type { ITextElement } from 'client-types/';

import { TextElement } from './Text';

interface Props {
  items: ITextElement[];
}

const InlinedTextList = ({ items }: Props) => (
  <Stack spacing={1}>
    {items.map((el, i) => {
      return (
        <Alert color="info" key={i} icon={false}>
          <AlertTitle>{el.name}</AlertTitle>
          <TextElement element={el} />
        </Alert>
      );
    })}
  </Stack>
);

export { InlinedTextList };
