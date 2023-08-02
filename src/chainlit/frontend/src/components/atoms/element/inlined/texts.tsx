import { Alert, AlertTitle, Stack } from '@mui/material';

import { ITextElement } from 'state/element';

import TextElement from '../text';

interface Props {
  items: ITextElement[];
}

export default function InlinedTextList({ items }: Props) {
  return (
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
}
