import CloudProvider from "components/cloudProvider";
import {
  ThumbDownAltOutlined,
  ThumbUpAltOutlined,
  ThumbDownAlt,
  ThumbUpAlt,
} from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import { gql, useMutation } from "@apollo/client";
import { IMessage } from "state/chat";
import toast from "react-hot-toast";
import { getErrorMessage } from "helpers/apollo";
import { useState } from "react";

const size = "16px";

const SetHumanFeedbackMutation = gql`
  mutation ($messageId: ID!, $humanFeedback: Int!) {
    setHumanFeedback(messageId: $messageId, humanFeedback: $humanFeedback) {
      id
      humanFeedback
    }
  }
`;

interface Props {
  message: IMessage;
}

function _FeedbackButtons({ message }: Props) {
  const [feedback, setFeedback] = useState(message.humanFeedback || 0);
  const [setHumanFeedbackMutation] = useMutation(SetHumanFeedbackMutation);
  const DownIcon = feedback === -1 ? ThumbDownAlt : ThumbDownAltOutlined;
  const UpIcon = feedback === 1 ? ThumbUpAlt : ThumbUpAltOutlined;

  const onClick = async (value: number) => {
    try {
      await toast.promise(
        setHumanFeedbackMutation({
          variables: {
            messageId: message.id,
            humanFeedback: value,
          },
        }),
        {
          loading: "Updating...",
          success: "Feedback updated!",
          error: (err) => {
            return <span>{getErrorMessage(err)}</span>;
          },
        }
      );
      setFeedback(value);
      message.humanFeedback = value;
    } catch (err) {
      console.log(err)
    }
  };

  return (
    <Stack direction="row">
      <IconButton onClick={() => onClick(feedback === -1 ? 0 : -1)}>
        <DownIcon sx={{ width: size, height: size }} />
      </IconButton>
      <IconButton onClick={() => onClick(feedback === 1 ? 0 : 1)}>
        <UpIcon sx={{ width: size, height: size }} />
      </IconButton>
    </Stack>
  );
}

export default function FeedbackButtons(props: Props) {
  return (
    <CloudProvider>
      <_FeedbackButtons {...props} />
    </CloudProvider>
  );
}
