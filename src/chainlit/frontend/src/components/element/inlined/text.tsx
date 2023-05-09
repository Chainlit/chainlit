import { Alert, AlertTitle, Stack } from '@mui/material';
import TextElement from 'components/element/text';
import { IElements } from 'state/element';

interface Props {
  items: IElements;
}

export default function InlinedTextList({ items }: Props) {
  return (
    <Stack spacing={1}>
      {Object.entries(items).map(([k, v]) => {
        return (
          <Alert color="info" key={k} icon={false}>
            <AlertTitle>{k}</AlertTitle>
            <TextElement element={v} />
          </Alert>
        );
      })}
    </Stack>
  );
}
