import { IconButton, IconButtonProps, Tooltip } from '@mui/material';

import GithubIcon from 'assets/github';

interface Props extends IconButtonProps {
  href?: string;
}

export default function GithubButton({ href, ...props }: Props) {
  if (!href) {
    return null;
  }

  return (
    <Tooltip title="See on Github">
      {/* @ts-expect-error href breaks IconButton props */}
      <IconButton color="inherit" href={href} target="_blank" {...props}>
        <GithubIcon sx={{ height: 20, width: 20 }} />
      </IconButton>
    </Tooltip>
  );
}
