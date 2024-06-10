import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { Alert, Box, Button, Skeleton, Stack } from '@mui/material';

import {
  ChainlitContext,
  IAction,
  IFeedback,
  IMessageElement,
  IStep,
  IThread,
  accessTokenState,
  nestMessages,
  useChatMessages
} from '@chainlit/react-client';

import { Translator } from 'components/i18n';
import ScrollContainer from 'components/molecules/messages/ScrollContainer';
import MessageContainer from 'components/organisms/chat/Messages/container';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

type Props = {
  thread?: IThread;
  error?: Error;
  isLoading?: boolean;
};

const Thread = ({ thread, error, isLoading }: Props) => {
  const accessToken = useRecoilValue(accessTokenState);
  const [steps, setSteps] = useState<IStep[]>([]);
  const apiClient = useContext(ChainlitContext);
  const { t } = useTranslation();
  const { threadId } = useChatMessages();
  const layoutMaxWidth = useLayoutMaxWidth();

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

  const onFeedbackDeleted = useCallback(
    async (message: IStep, onSuccess: () => void, feedbackId: string) => {
      try {
        toast.promise(apiClient.deleteFeedback(feedbackId, accessToken), {
          loading: t('components.organisms.chat.Messages.index.updating'),
          success: () => {
            setSteps((prev) =>
              prev.map((step) => {
                if (step.id === message.id) {
                  return {
                    ...step,
                    feedback: undefined
                  };
                }
                return step;
              })
            );

            onSuccess();
            return t(
              'components.organisms.chat.Messages.index.feedbackUpdated'
            );
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
    return (
      <>
        {[1, 2, 3].map((index) => (
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
                maxWidth: layoutMaxWidth,
                width: '100%',
                height: 100
              }}
            />
          </Stack>
        ))}
      </>
    );
  }

  if (!thread || error) {
    return null;
  }

  const elements = thread.elements;
  const actions: IAction[] = [];
  const messages = nestMessages(steps);

  return (
    <Stack flexGrow={1} width="100%" height="100%">
      <Box
        sx={{
          width: '100%',
          maxWidth: layoutMaxWidth,
          mx: 'auto',
          my: 2
        }}
      >
        <Alert
          sx={{ mx: 2 }}
          id="thread-info"
          severity="info"
          action={
            <Button
              component={Link}
              color="inherit"
              size="small"
              to={threadId ? `/thread/${threadId}` : '/'}
            >
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
      <ScrollContainer autoScroll={true}>
        <MessageContainer
          loading={false}
          actions={actions}
          elements={(elements || []) as IMessageElement[]}
          onFeedbackUpdated={onFeedbackUpdated}
          onFeedbackDeleted={onFeedbackDeleted}
          messages={messages}
        />
      </ScrollContainer>
    </Stack>
  );
};

export { Thread };
