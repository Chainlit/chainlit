import { Alert, AlertTitle, Stack } from '@mui/material';

import { ITextElement } from 'src/types/element';

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
