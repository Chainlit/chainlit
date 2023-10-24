import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';
import { useMemo } from 'react';
import { useSetRecoilState } from 'recoil';
import Dialog from 'src/Dialog';
import { AccentButton } from 'src/buttons/AccentButton';
import { TextInput } from 'src/inputs';
import { updateMessageById } from 'utils/message';

import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { nestedMessagesState } from 'hooks/useChat/state';

import { IMessage } from 'src/types/message';

const ICON_SIZE = '16px';

interface Props {
  message: IMessage;
}

const FeedbackButtons = ({ message }: Props) => {
  const { onFeedbackUpdated } = useContext(MessageContext);
  const feedback = message.humanFeedback || 0;
  const comment = message.humanFeedbackComment;
  const DownIcon = feedback === -1 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<number>();
  const [commentInput, setCommentInput] = useState<string>();
  const setNestedMessages = useSetRecoilState(nestedMessagesState);

  const handleFeedbackChanged = (feedback: number, comment?: string) => {
    onFeedbackUpdated &&
      onFeedbackUpdated(
        message.id,
        feedback,
        () =>
          setNestedMessages((prev) =>
            updateMessageById(prev, message.id, {
              ...message,
              humanFeedback: feedback,
              humanFeedbackComment: comment
            })
          ),
        comment
      );
  };

  const handleFeedbackClick = (status: number) => {
    if (feedback === status) {
      handleFeedbackChanged(0);
    } else {
      setShowFeedbackDialog(status);
    }
  };

  const buttons = useMemo(() => {
    const baseButtons = [
      () => (
        <Tooltip title="Negative feedback">
          <Button
            className={`negative-feedback-${feedback === -1 ? 'on' : 'off'}`}
            onClick={() => {
              handleFeedbackClick(-1);
            }}
            size="small"
          >
            <DownIcon sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </Button>
        </Tooltip>
      ),
      () => (
        <Tooltip title="Positive feedback">
          <Button
            className={`positive-feedback-${feedback === 1 ? 'on' : 'off'}`}
            onClick={() => {
              handleFeedbackClick(1);
            }}
            size="small"
          >
            <UpIcon
              sx={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                color: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[600]
                    : theme.palette.text.primary
              }}
            />
          </Button>
        </Tooltip>
      )
    ];

    if (comment) {
      baseButtons.push(() => (
        <Tooltip title="Feedback comment">
          <Button
            onClick={() => {
              setShowFeedbackDialog(feedback);
              setCommentInput(comment);
            }}
            className="feedback-comment-edit"
            size="small"
          >
            <StickyNote2Outlined sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </Button>
        </Tooltip>
      ));
    }

    return baseButtons;
  }, [feedback, comment]);

  return (
    <>
      <Stack direction="row" spacing={1} color="text.secondary">
        <ButtonGroup variant="text" color="inherit" sx={{ height: 26 }}>
          {buttons.map((FeedbackButton, index) => (
            <FeedbackButton key={`feedback-button-${index}`} />
          ))}
        </ButtonGroup>
      </Stack>

      <Dialog
        onClose={() => {
          setShowFeedbackDialog(undefined);
        }}
        open={!!showFeedbackDialog}
        title={
          <Stack direction="row" alignItems="center" gap={2}>
            {showFeedbackDialog === -1 ? <DownIcon /> : <UpIcon />}
            Provide additional feedback
          </Stack>
        }
        content={
          <TextInput
            id="feedbackDescription"
            value={commentInput}
            multiline
            size="medium"
            onChange={(e) => {
              if (e.target.value === '') {
                setCommentInput(undefined);
              } else {
                setCommentInput(e.target.value);
              }
            }}
          />
        }
        actions={
          <AccentButton
            type="submit"
            variant="outlined"
            onClick={() => {
              if (showFeedbackDialog != null) {
                handleFeedbackChanged(showFeedbackDialog, commentInput);
              }
              setShowFeedbackDialog(undefined);
              setCommentInput(undefined);
            }}
            autoFocus
          >
            Submit feedback
          </AccentButton>
        }
      />
    </>
  );
};

export { FeedbackButtons };
