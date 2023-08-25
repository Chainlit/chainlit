import { ChainlitAPI } from 'api/chainlitApi';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue } from 'recoil';
import { useToggle } from 'usehooks-ts';

import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import Dialog from 'components/atoms/Dialog';
import AccentButton from 'components/atoms/buttons/accentButton';
import TextInput from 'components/organisms/inputs/textInput';

import { messagesState } from 'state/chat';
import { accessTokenState } from 'state/user';

import { IMessage } from 'types/chat';
import { Feedback, FeedbackStatus } from 'types/message';

const size = '16px';

interface Props {
  message: IMessage;
}

export default function FeedbackButtons({ message }: Props) {
  const accessToken = useRecoilValue(accessTokenState);
  const messages = useRecoilValue(messagesState);

  const [commentInput, setCommentInput] = useState('');
  const [feedback, setFeedback] = useState(
    message.humanFeedback || FeedbackStatus.DEFAULT
  );
  const [showFeedbackDialog, toggleFeedbackDialog] = useToggle();

  const DownIcon =
    feedback === FeedbackStatus.DISLIKED ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon =
    feedback === FeedbackStatus.LIKED ? ThumbUpAlt : ThumbUpAltOutlined;

  const updateFeedback = async (feedback: Feedback, onSuccess?: () => void) => {
    try {
      await toast.promise(
        ChainlitAPI.setHumanFeedback(message.id!, feedback, accessToken),
        {
          loading: 'Updating...',
          success: 'Feedback updated!',
          error: (err) => {
            return <span>{err.message}</span>;
          }
        }
      );

      const globalMessage = messages.find((m) => m.id === message.id);
      if (globalMessage) {
        globalMessage.humanFeedback = feedback.status;
      }

      onSuccess && onSuccess();
      setCommentInput('');
    } catch (err) {
      console.log(err);
    }
  };

  const updateFeedbackStatus = (status: FeedbackStatus) => {
    updateFeedback({ status }, () => setFeedback(status));
  };

  const renderDialog = () => {
    return (
      <Dialog
        open={showFeedbackDialog}
        onClose={toggleFeedbackDialog}
        title={
          <Stack direction="row" alignItems="center" gap={2}>
            {feedback === FeedbackStatus.DISLIKED ? <DownIcon /> : <UpIcon />}
            Provide additional feedback
          </Stack>
        }
        content={
          <TextInput
            multiline
            id={'feedbackDescription'}
            value={commentInput}
            size="medium"
            onChange={(e) => setCommentInput(e.target.value)}
          />
        }
        actions={
          <AccentButton
            type={'submit'}
            variant="outlined"
            onClick={() => {
              updateFeedback(
                {
                  status: feedback,
                  comment: commentInput
                },
                toggleFeedbackDialog
              );
            }}
            autoFocus
          >
            Submit feedback
          </AccentButton>
        }
      />
    );
  };

  const onToggleFeedbackDialog = (value: FeedbackStatus) => {
    const status = feedback === value ? FeedbackStatus.DEFAULT : value;

    status !== FeedbackStatus.DEFAULT && toggleFeedbackDialog();
    updateFeedbackStatus(status);
  };

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Negative feedback">
        <IconButton
          className={`negative-feedback-${
            feedback === FeedbackStatus.DISLIKED ? 'on' : 'off'
          }`}
          onClick={() => onToggleFeedbackDialog(FeedbackStatus.DISLIKED)}
          size="small"
        >
          <DownIcon sx={{ width: size, height: size }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Positive feedback">
        <IconButton
          className={`positive-feedback-${
            feedback === FeedbackStatus.LIKED ? 'on' : 'off'
          }`}
          onClick={() => onToggleFeedbackDialog(FeedbackStatus.LIKED)}
          size="small"
        >
          <UpIcon sx={{ width: size, height: size }} />
        </IconButton>
      </Tooltip>
      {renderDialog()}
    </Stack>
  );
}
