import { useRecoilValue, useSetRecoilState } from 'recoil';

import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { IMessage } from 'state/chat';
import { playgroundState } from 'state/playground';
import { projectSettingsState } from 'state/project';

import FeedbackButtons from './feedbackButtons';

interface Props {
  message: IMessage;
}

export default function Buttons({ message }: Props) {
  const projectSettings = useRecoilValue(projectSettingsState);
  const setPlayground = useSetRecoilState(playgroundState);

  const showEditButton = !!message.prompt && !!message.content;

  const editButton = showEditButton && (
    <Tooltip title="Inspect in prompt playground">
      <IconButton
        size="small"
        className="playground-button"
        onClick={() => {
          if (!message.prompt) return;
          setPlayground((old) => ({ ...old, prompt: message.prompt }));
        }}
      >
        <ScienceIcon sx={{ width: '16px', height: '16px' }} />
      </IconButton>
    </Tooltip>
  );

  const showFeedbackButtons =
    !!projectSettings?.project?.database &&
    !message.authorIsUser &&
    !message.waitForAnswer &&
    !!message.content;

  if (!showEditButton && !showFeedbackButtons) return null;

  return (
    <Stack direction="row" spacing={1}>
      {editButton}
      {showFeedbackButtons && <FeedbackButtons message={message} />}
    </Stack>
  );
}
