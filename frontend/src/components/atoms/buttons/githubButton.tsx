import { useRecoilValue } from 'recoil';

import { Button, ButtonProps } from '@mui/material';

import GithubIcon from 'assets/github';

import { projectSettingsState } from 'state/project';

interface Props extends ButtonProps {}

export default function GithubButton({ ...props }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);
  const href = pSettings?.ui.github;
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
