import { IconButton, Tooltip } from '@mui/material';

import GithubIcon from 'components/icons/github';

interface Props {
  href?: string;
}

export default function GithubButton({ href }: Props) {
  if (!href) {
    return null;
  }

  return (
    <Tooltip title="See on Github">
      <IconButton color="inherit" href={href} target="_blank">
        <GithubIcon />
      </IconButton>
    </Tooltip>
  );
}
