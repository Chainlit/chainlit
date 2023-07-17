import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue } from 'recoil';

import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { IMessage, messagesState } from 'state/chat';
import { clientState } from 'state/client';

const size = '16px';

interface Props {
  message: IMessage;
}

export default function FeedbackButtons({ message }: Props) {
  const messages = useRecoilValue(messagesState);
  const [feedback, setFeedback] = useState(message.humanFeedback || 0);
  const client = useRecoilValue(clientState);
  const DownIcon = feedback === -1 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;

  const onClick = async (value: number) => {
    try {
      await toast.promise(client.setHumanFeedback(message.id!, value), {
        loading: 'Updating...',
        success: 'Feedback updated!',
        error: (err) => {
          return <span>{err.message}</span>;
        }
      });

      const globalMessage = messages.find((m) => m.id === message.id);
      if (globalMessage) {
        globalMessage.humanFeedback = value;
      }
      setFeedback(value);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Negative feedback">
        <IconButton
          className={`negative-feedback-${feedback === -1 ? 'on' : 'off'}`}
          onClick={() => onClick(feedback === -1 ? 0 : -1)}
          size="small"
        >
          <DownIcon sx={{ width: size, height: size }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Positive feedback">
        <IconButton
          className={`positive-feedback-${feedback === 1 ? 'on' : 'off'}`}
          onClick={() => onClick(feedback === 1 ? 0 : 1)}
          size="small"
        >
          <UpIcon sx={{ width: size, height: size }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
