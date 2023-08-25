import { useRecoilValue, useSetRecoilState } from 'recoil';

import BugReportIcon from '@mui/icons-material/BugReport';
import { IconButton, Stack, Tooltip } from '@mui/material';

import ActionList from 'components/atoms/actionsList';

import { playgroundState } from 'state/playground';
import { projectSettingsState } from 'state/project';

import { IAction } from 'types/action';
import { IMessage } from 'types/chat';

import FeedbackButtons from './feedbackButtons';

interface Props {
  message: IMessage;
  actions: IAction[];
}

export default function Buttons({ message, actions }: Props) {
  const projectSettings = useRecoilValue(projectSettingsState);
  const setPlayground = useSetRecoilState(playgroundState);

  const scopedActions = actions.filter((a) => {
    if (a.forId) {
      return a.forId === message.id;
    }
    return true;
  });

  const showEditButton = !!message.prompt && !!message.content;

  const editButton = showEditButton ? (
    <Tooltip title="Inspect in prompt playground">
      <IconButton
        size="small"
        className="playground-button"
        onClick={() => {
          if (!message.prompt) return;
          setPlayground((old) => ({
            ...old,
            prompt: message.prompt,
            originalPrompt: message.prompt
          }));
        }}
      >
        <BugReportIcon sx={{ width: '16px', height: '16px' }} />
      </IconButton>
    </Tooltip>
  ) : null;

  const showFeedbackButtons =
    !!projectSettings?.project?.database &&
    !message.authorIsUser &&
    !message.waitForAnswer &&
    !!message.content;

  return (
    <Stack direction="row" spacing={1}>
      {editButton}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
      {scopedActions.length ? <ActionList actions={scopedActions} /> : null}
    </Stack>
  );
}
