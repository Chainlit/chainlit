import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { firstUserInteraction, useChatSession } from '@chainlit/react-client';

import Dialog from 'components/atoms/Dialog';
import { AccentButton } from 'components/atoms/buttons/AccentButton';
import { TextInput } from 'components/atoms/inputs';

import type { IStep } from 'client-types/';

const ICON_SIZE = '16px';

interface Props {
  message: IStep;
}

const FeedbackButtons = ({ message }: Props) => {
  const { onFeedbackUpdated, onFeedbackDeleted } = useContext(MessageContext);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<number>();
  const [commentInput, setCommentInput] = useState<string>();
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const { idToResume } = useChatSession();

  const [feedback, setFeedback] = useState(message.feedback?.value);
  const [comment, setComment] = useState(message.feedback?.comment);

  const DownIcon = feedback === 0 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;

  const handleFeedbackChanged = (feedback?: number, comment?: string) => {
    if (feedback === undefined) {
      if (onFeedbackDeleted && message.feedback?.id) {
        onFeedbackDeleted(
          message,
          () => {
            setFeedback(undefined);
            setComment(undefined);
          },
          message.feedback.id
        );
      }
    } else if (onFeedbackUpdated) {
      onFeedbackUpdated(
        message,
        () => {
          setFeedback(feedback);
          setComment(comment);
        },
        {
          ...(message.feedback || {}),
          forId: message.id,
          value: feedback,
          comment
        }
      );
    }
  };

  const handleFeedbackClick = (nextValue: number) => {
    if (feedback === nextValue) {
      handleFeedbackChanged(undefined);
    } else {
      setShowFeedbackDialog(nextValue);
    }
  };

  const isPersisted = firstInteraction || idToResume;
  const isStreaming = !!message.streaming;

  const disabled = isStreaming || !isPersisted;

  const buttons = useMemo(() => {
    const iconSx = {
      width: ICON_SIZE,
      height: ICON_SIZE
    };

    const baseButtons = [
      () => (
        <Tooltip title="Helpful">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              className={`positive-feedback-${feedback === 1 ? 'on' : 'off'}`}
              onClick={() => {
                handleFeedbackClick(1);
              }}
            >
              <UpIcon sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      ),
      () => (
        <Tooltip title="Not helpful">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              className={`negative-feedback-${feedback === -1 ? 'on' : 'off'}`}
              onClick={() => {
                handleFeedbackClick(0);
              }}
            >
              <DownIcon sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      )
    ];

    if (comment) {
      baseButtons.push(() => (
        <Tooltip title="Feedback">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              onClick={() => {
                setShowFeedbackDialog(feedback);
                setCommentInput(comment);
              }}
              className="feedback-comment-edit"
            >
              <StickyNote2Outlined sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      ));
    }

    return baseButtons;
  }, [feedback, comment, disabled]);

  return (
    <>
      <Stack direction="row">
        {buttons.map((FeedbackButton, index) => (
          <FeedbackButton key={`feedback-button-${index}`} />
        ))}
      </Stack>

      <Dialog
        maxWidth="xs"
        onClose={() => {
          setShowFeedbackDialog(undefined);
        }}
        open={showFeedbackDialog !== undefined}
        title={
          <Stack direction="row" alignItems="center" gap={2}>
            {showFeedbackDialog === 0 ? <DownIcon /> : <UpIcon />}
            Add a comment
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
            id="feedbackSubmit"
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
