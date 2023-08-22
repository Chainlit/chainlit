import { Tooltip } from '@mui/material';

import AccentButton from 'components/atoms/buttons/accentButton';

interface Props {
  hasTemplate?: boolean;
}

export default function SaveButton({ hasTemplate }: Props) {
  if (!hasTemplate) {
    return null;
  }

  return (
    <Tooltip title="Coming soon!">
      <span>
        <AccentButton size="large" variant="contained" disabled>
          Save
        </AccentButton>
      </span>
    </Tooltip>
  );
}
