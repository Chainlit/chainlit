import { Stack } from '@mui/material';

import ActionRef from 'components/action/ref';

import { IAction } from 'state/action';

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
