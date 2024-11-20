import { useUpload } from 'hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box, Stack } from '@mui/material';

import {
  IStep,
  threadHistoryState,
  useAuth,
  useChatData,
  useChatInteract,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import { ErrorBoundary } from 'components/atoms/ErrorBoundary';
import { Translator } from 'components/i18n';
import { useTranslation } from 'components/i18n/Translator';
import ScrollContainer from 'components/molecules/messages/ScrollContainer';
import { TaskList } from 'components/molecules/tasklist/TaskList';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { IAttachment, attachmentsState } from 'state/chat';

import Messages from './Messages';
import DropScreen from './dropScreen';
import InputBox from './inputBox';
import WelcomeScreen from './welcomeScreen';
import { Header } from '../header';
import { threadStorage } from 'services/ThreadStorageService';

interface IChatProps {
  isExpanded?: boolean;
  toggleExpand?: () => void;
  toggleChat?: () => void;
  threadMessages?: IStep[];
}

const Chat = ({ isExpanded, toggleExpand, toggleChat, threadMessages }: IChatProps) => {
  const { user } = useAuth();
  const { config } = useConfig();
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const { messages } = useChatMessages();

  const [autoScroll, setAutoScroll] = useState(true);
  const { error, disabled } = useChatData();
  const { uploadFile } = useChatInteract();
  const uploadFileRef = useRef(uploadFile);
  const navigate = useNavigate();

  const fileSpec = useMemo(
    () => ({
      max_size_mb:
        config?.features?.spontaneous_file_upload?.max_size_mb || 500,
      max_files: config?.features?.spontaneous_file_upload?.max_files || 20,
      accept: config?.features?.spontaneous_file_upload?.accept || ['*/*']
    }),
    [config]
  );

  const { t } = useTranslation();
  const layoutMaxWidth = useLayoutMaxWidth();

  useEffect(() => {
    uploadFileRef.current = uploadFile;
  }, [uploadFile]);

  const onFileUpload = useCallback(
    (payloads: File[]) => {
      const attachements: IAttachment[] = payloads.map((file) => {
        const id = uuidv4();

        const { xhr, promise } = uploadFileRef.current(file, (progress) => {
          setAttachments((prev) =>
            prev.map((attachment) => {
              if (attachment.id === id) {
                return {
                  ...attachment,
                  uploadProgress: progress
                };
              }
              return attachment;
            })
          );
        });

        promise
          .then((res) => {
            setAttachments((prev) =>
              prev.map((attachment) => {
                if (attachment.id === id) {
                  return {
                    ...attachment,
                    // Update with the server ID
                    serverId: res.id,
                    uploaded: true,
                    uploadProgress: 100,
                    cancel: undefined
                  };
                }
                return attachment;
              })
            );
          })
          .catch((error) => {
            toast.error(
              `${t('components.organisms.chat.index.failedToUpload')} ${
                file.name
              }: ${error.message}`
            );
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          });

        return {
          id,
          type: file.type,
          name: file.name,
          size: file.size,
          uploadProgress: 0,
          cancel: () => {
            toast.info(
              `${t('components.organisms.chat.index.cancelledUploadOf')} ${
                file.name
              }`
            );
            xhr.abort();
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          },
          remove: () => {
            setAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== id)
            );
          }
        };
      });
      setAttachments((prev) => prev.concat(attachements));
    },
    [uploadFile]
  );

  const onFileUploadError = useCallback(
    (error: string) => toast.error(error),
    [toast]
  );

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  const { threadId } = useChatMessages();

  useEffect(() => {
    const currentPage = new URL(window.location.href);
    if (
      user &&
      config?.dataPersistence &&
      threadId &&
      currentPage.pathname === '/'
    ) {
      navigate(`/thread/${threadId}`);
    } else {
      setThreads((prev) => ({
        ...prev,
        currentThreadId: threadId
      }));
    }
  }, []);

  useEffect(() => {
    const saveThread = async () => {
      if (messages.length > 0 && threadId) {
        const currentThread = {
          id: threadId,
          createdAt: new Date().toISOString(),
          steps: messages,
          name: `Chat ${new Date().toLocaleString()}`
        };
        await threadStorage.saveThread(currentThread);
      }
    };
    saveThread();
  }, [messages, threadId]);

  const enableMultiModalUpload =
    !disabled && config?.features?.spontaneous_file_upload?.enabled;

  return (
    <Box
      {...(enableMultiModalUpload
        ? upload?.getRootProps({ className: 'dropzone' })
        : {})}
      // Disable the onFocus and onBlur events in react-dropzone to avoid interfering with child trigger events
      onBlur={undefined}
      onFocus={undefined}
      display="flex"
      width="100%"
      flexGrow={1}
      position="relative"
    > 
      {toggleExpand && toggleChat ? (
        <Header isExpanded={isExpanded} toggleExpand={toggleExpand} toggleChat={toggleChat} />
      ) : null} 
      {upload ? (
        <>
          <input id="#upload-drop-input" {...upload.getInputProps()} />
          {upload?.isDragActive ? <DropScreen /> : null}
        </>
      ) : null}
      <Stack width="100%">
        {error ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: layoutMaxWidth,
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} id="session-error" severity="error">
              <Translator path="components.organisms.chat.index.couldNotReachServer" />
            </Alert>
          </Box>
        ) : null}
        <TaskList isMobile={true} />
        <ErrorBoundary>
          <ScrollContainer
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
          >
            <WelcomeScreen hideLogo />
            <Box py={1} />
            <Messages messages={threadMessages || messages} />
          </ScrollContainer>
          <InputBox
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
          />
        </ErrorBoundary>
      </Stack>
    </Box>
  );
};

export default Chat;
