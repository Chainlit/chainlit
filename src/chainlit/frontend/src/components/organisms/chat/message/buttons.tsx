import { useRecoilValue, useSetRecoilState } from 'recoil';

import EditIcon from '@mui/icons-material/EditOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import ActionList from 'components/atoms/actionsList';

import { IAction } from 'state/action';
import { IMessage } from 'state/chat';
import { playgroundState } from 'state/playground';
import { projectSettingsState } from 'state/project';

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
    <Tooltip title="Open in prompt playground">
      <IconButton
        size="small"
        className="playground-button"
        onClick={() => {
          if (!message.prompt) return;
          setPlayground({
            llmSettings: message.llmSettings,
            prompt: message.prompt,
            completion: message.content!
          });
        }}
      >
        <EditIcon sx={{ width: '16px', height: '16px' }} />
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
