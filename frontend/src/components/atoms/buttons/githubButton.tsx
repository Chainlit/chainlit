import { useRecoilValue } from 'recoil';

import { IconButton, IconButtonProps, Tooltip } from '@mui/material';

import GithubIcon from 'assets/github';

import { projectSettingsState } from 'state/project';

interface Props extends IconButtonProps {}

export default function GithubButton({ ...props }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);
  const href = pSettings?.ui.github;
  if (!href) return null;
  return (
    <Tooltip title="See on Github">
      {/* @ts-expect-error href breaks IconButton props */}
      <IconButton color="inherit" href={href} target="_blank" {...props}>
        <GithubIcon sx={{ height: 20, width: 20 }} />
      </IconButton>
    </Tooltip>
  );
}
