import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';
import { useMemo } from 'react';
import Dialog from 'src/Dialog';
import { AccentButton } from 'src/buttons/AccentButton';
import { TextInput } from 'src/inputs';

import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import type { IStep } from 'client-types/';

const ICON_SIZE = '16px';

interface Props {
  message: IStep;
}

const FeedbackButtons = ({ message }: Props) => {
  const { onFeedbackUpdated } = useContext(MessageContext);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<number>();
  const [commentInput, setCommentInput] = useState<string>();

  const [feedback, setFeedback] = useState(message.feedback?.value || 0);
  const [comment, setComment] = useState(message.feedback?.comment);

  const DownIcon = feedback === -1 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;

  const handleFeedbackChanged = (feedback: number, comment?: string) => {
    onFeedbackUpdated &&
      onFeedbackUpdated(
        message,
        () => {
          setFeedback(feedback);
          setComment(comment);
        },
        {
          ...(message.feedback || { strategy: 'BINARY' }),
          forId: message.id,
          value: feedback,
          comment
        }
      );
  };

  const handleFeedbackClick = (status: number) => {
    if (feedback === status) {
      handleFeedbackChanged(0);
    } else {
      setShowFeedbackDialog(status);
    }
  };

  const disabled = !!message.streaming;

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
                handleFeedbackClick(-1);
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
