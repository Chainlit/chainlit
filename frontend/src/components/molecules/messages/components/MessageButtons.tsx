import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { useRecoilValue } from 'recoil';
import { grey } from 'theme/palette';

import Stack from '@mui/material/Stack';

import { useChatMessages } from '@chainlit/react-client';

import { ClipboardCopy } from 'components/atoms/ClipboardCopy';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import { projectSettingsState } from 'state/project';

import { type IStep } from 'client-types/';

import { DebugButton } from './DebugButton';
import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  message: IStep;
}

const MessageButtons = ({ message }: Props) => {
  const isDark = useIsDarkMode();
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);
  const pSettings = useRecoilValue(projectSettingsState);
  const { firstInteraction } = useChatMessages();

  const isUser = message.type === 'user_message';
  const isAsk = message.waitForAnswer;
  const hasContent = !!message.output;
  const showCopyButton =
    hasContent && !isUser && !isAsk && !message.disableFeedback;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableFeedback &&
    !isUser &&
    !isAsk &&
    hasContent;

  const showDebugButton =
    !!pSettings?.debugUrl && !!message.threadId && !!firstInteraction;

  const show = showCopyButton || showDebugButton || showFeedbackButtons;

  if (!show || message.streaming) {
    return null;
  }

  return (
    <Stack
      sx={{ marginLeft: '-8px !important' }}
      alignItems="center"
      direction="row"
      color={isDark ? grey[400] : grey[600]}
    >
      {showCopyButton ? <ClipboardCopy value={message.output} /> : null}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
      {showDebugButton ? (
        <DebugButton debugUrl={pSettings.debugUrl!} step={message} />
      ) : null}
    </Stack>
  );
};

export { MessageButtons };
