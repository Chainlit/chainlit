import { Button, ButtonProps } from '@mui/material';

import GithubIcon from 'assets/github';

import { useConfig } from 'client-types/*';

type Props = ButtonProps;

export default function GithubButton({ ...props }: Props) {
  const { config } = useConfig();
  const href = config?.ui.github;
  if (!href) return null;
  return (
    //@ts-expect-error href is not a valid prop for Button
    <Button
      href={href}
      target="_blank"
      color="inherit"
      sx={{
        justifyContent: 'start',
        textTransform: 'none'
      }}
      startIcon={<GithubIcon sx={{ height: 20, width: 20 }} />}
      {...props}
    >
      Repo
    </Button>
  );
}
