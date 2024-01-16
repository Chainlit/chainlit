import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { Alert, Box, Button, Skeleton, Stack } from '@mui/material';

import {
  IAction,
  IFeedback,
  IMessageElement,
  IStep,
  IThread,
  accessTokenState,
  nestMessages
} from '@chainlit/react-client';

import SideView from 'components/atoms/element/sideView';
import { Translator } from 'components/i18n';
import MessageContainer from 'components/organisms/chat/Messages/container';

import { apiClientState } from 'state/apiClient';

type Props = {
  thread?: IThread;
  error?: Error;
  isLoading?: boolean;
};

const Thread = ({ thread, error, isLoading }: Props) => {
  const accessToken = useRecoilValue(accessTokenState);
  const [steps, setSteps] = useState<IStep[]>([]);
  const apiClient = useRecoilValue(apiClientState);

  useEffect(() => {
    if (!thread) return;
    setSteps(thread.steps);
  }, [thread]);

  const onFeedbackUpdated = useCallback(
    async (message: IStep, onSuccess: () => void, feedback: IFeedback) => {
      try {
        toast.promise(apiClient.setFeedback(feedback, accessToken), {
          loading: 'Updating',
          success: (res) => {
            setSteps((prev) =>
              prev.map((step) => {
                if (step.id === message.id) {
                  return {
                    ...step,
                    feedback: {
                      ...feedback,
                      id: res.feedbackId
                    }
                  };
                }
                return step;
              })
            );

            onSuccess();
            return 'Feedback updated!';
          },
          error: (err) => {
            return <span>{err.message}</span>;
          }
        });
      } catch (err) {
        console.log(err);
      }
    },
    []
  );

  if (isLoading) {
    return [1, 2, 3].map((index) => (
      <Stack
        key={`thread-skeleton-${index}`}
        sx={{
          px: 2,
          gap: 4,
          mt: 5,
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        <Stack>
          <Skeleton width={50} />
          <Skeleton width={50} />
        </Stack>
        <Skeleton
          variant="rounded"
          sx={{
            maxWidth: '60rem',
            width: '100%',
            height: 100
          }}
        />
      </Stack>
    ));
  }

  if (!thread || error) {
    return null;
  }

  const elements = thread.elements;
  const actions: IAction[] = [];
  const messages = nestMessages(steps);

  return (
    <Stack direction="row" flexGrow={1} width="100%" height="100%">
      <SideView>
        <Box
          sx={{
            width: '100%',
            maxWidth: '60rem',
            mx: 'auto',
            my: 2
          }}
        >
          <Alert
            sx={{ mx: 2 }}
            id="thread-info"
            severity="info"
            action={
              <Button component={Link} color="inherit" size="small" to="/">
                <Translator path="components.organisms.threadHistory.Thread.backToChat" />
              </Button>
            }
          >
            <Translator path="components.organisms.threadHistory.Thread.chatCreatedOn" />{' '}
            {new Intl.DateTimeFormat(undefined, {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            }).format(new Date(thread.createdAt))}
            .
          </Alert>
        </Box>
        <MessageContainer
          loading={false}
          avatars={[]}
          actions={actions}
          elements={(elements || []) as IMessageElement[]}
          onFeedbackUpdated={onFeedbackUpdated}
          messages={messages}
          autoScroll={true}
        />
      </SideView>
    </Stack>
  );
};

export { Thread };
