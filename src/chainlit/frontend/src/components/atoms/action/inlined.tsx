import { Stack } from '@mui/material';

import { IAction } from 'state/action';

import ActionRef from './ref';

interface Props {
  actions: IAction[];
}

export default function InlinedActionList({ actions }: Props) {
  return (
    <Stack direction="row" spacing={1}>
      {actions.map((a) => {
        return <ActionRef key={a.name} action={a} />;
      })}
    </Stack>
  );
}
