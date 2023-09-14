import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';

import {
  ThumbDownAlt,
  ThumbDownAltOutlined,
  ThumbUpAlt,
  ThumbUpAltOutlined
} from '@mui/icons-material';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { IMessage } from 'src/types/message';

const ICON_SIZE = '16px';

interface Props {
  message: IMessage;
}

const FeedbackButtons = ({ message }: Props) => {
  const { onFeedbackUpdated } = useContext(MessageContext);
  const [feedback, setFeedback] = useState(message.humanFeedback || 0);
  const DownIcon = feedback === -1 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;

  const handleFeedbackChanged = (feedback: number) => {
    onFeedbackUpdated &&
      onFeedbackUpdated(message.id, feedback, () => setFeedback(feedback));
  };

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Negative feedback">
        <IconButton
          className={`negative-feedback-${feedback === -1 ? 'on' : 'off'}`}
          onClick={() => handleFeedbackChanged(feedback === -1 ? 0 : -1)}
          size="small"
        >
          <DownIcon sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Positive feedback">
        <IconButton
          className={`positive-feedback-${feedback === 1 ? 'on' : 'off'}`}
          onClick={() => handleFeedbackChanged(feedback === 1 ? 0 : 1)}
          size="small"
        >
          <UpIcon sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export { FeedbackButtons };
