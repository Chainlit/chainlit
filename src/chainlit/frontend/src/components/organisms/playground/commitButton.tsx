import { Tooltip } from '@mui/material';

import AccentButton from 'components/atoms/buttons/accentButton';

import CommitIcon from 'assets/commit';

interface Props {
  hasTemplate?: boolean;
}

export default function CommitButton({ hasTemplate }: Props) {
  if (!hasTemplate) {
    return null;
  }

  return (
    <Tooltip title="Coming soon!">
      <span>
        <AccentButton startIcon={<CommitIcon />} disabled>
          Commit changes
        </AccentButton>
      </span>
    </Tooltip>
  );
}
