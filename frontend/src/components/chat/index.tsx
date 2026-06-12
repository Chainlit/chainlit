
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
  threadHistoryState,
  useAuth,
  useChatData,
  useChatInteract,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { TaskList } from '@/components/Tasklist';
import { Translator } from '@/components/i18n';
import { useTranslation } from '@/components/i18n/Translator';

import { useUpload } from '@/hooks/useUpload';
import { useLayoutMaxWidth } from '@/hooks/useLayoutMaxWidth';

import { IAttachment, attachmentsState } from '@/state/chat';

import { ErrorBoundary } from '../ErrorBoundary';
import ChatFooter from './Footer';
import MessagesContainer from './MessagesContainer';
import ScrollContainer from './ScrollContainer';
import WelcomeScreen from './WelcomeScreen';

const Chat = () => {
  const { user } = useAuth();
  const { config } = useConfig();
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);

  const autoScrollRef = useRef(true);
  const { error, disabled, callFn } = useChatData();
  const { uploadFile } = useChatInteract();
  const uploadFileRef = useRef(uploadFile);
  
  const navigate = useNavigate(); 

  const fileSpec = useMemo(
    () => ({
      max_size_mb:
        config?.features?.spontaneous_file_upload?.max_size_mb || 500,
      max_files: config?.features?.spontaneous_file_upload?.max_files || 20,
      accept: config?.features?.spontaneous_file_upload?.accept || {
        'application/*': [], 
        'audio/*': [], 
        'image/*': [], 
        'text/*': [], 
        'video/*': [] 
      }
    }),
    [config]
  );

  const { t } = useTranslation();
  const layoutMaxWidth = useLayoutMaxWidth();

  useEffect(() => {
    if (callFn) {
      const event = new CustomEvent('chainlit-call-fn', {
        detail: callFn
      });
      window.dispatchEvent(event);
    }
  }, [callFn]);

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
              `${t('chat.fileUpload.errors.failed')} ${file.name}: ${
                typeof error === 'object' && error !== null
                  ? (error.message ?? error)
                  : error
              }`
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
          file,
          cancel: () => {
            toast.info(`${t('chat.fileUpload.errors.cancelled')} ${file.name}`);
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
    [uploadFile, setAttachments, t]
  );

  const onFileUploadError = useCallback(
    (error: string) => toast.error(error),
    []
  );

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  const { threadId } = useChatMessages();

  useEffect(() => {
    // <-- AdaptÃ© pour Next.js : utilisation de pathname au lieu de window.location.href
    if (
      user &&
      config?.dataPersistence &&
      threadId &&
      (pathname === '/' || pathname === '/chat')
    ) {
      navigate(`/thread/${threadId}`);
    } else {
      setThreads((prev) => ({
        ...prev,
        currentThreadId: threadId
      }));
    }
  }, [user, config, threadId, pathname, navigate, setThreads]);

  const enableAttachments =
    !disabled && config?.features?.spontaneous_file_upload?.enabled;
    
  return (
    <div
      {...(enableAttachments
        ? upload.getRootProps({ className: 'dropzone' })
        : {})}
      onBlur={undefined}
      onFocus={undefined}
      className="flex w-full h-full flex-col relative"
    >
      {enableAttachments ? (
        <input id="#upload-drop-input" {...upload.getInputProps()} />
      ) : null}

      {error ? (
        <div className="w-full mx-auto my-2">
          <Alert className="mx-2" id="session-error" variant="error">
            <Translator path="common.status.error.serverConnection" />
          </Alert>
        </div>
      ) : null}
      <ErrorBoundary>
        <ScrollContainer
          autoScrollUserMessage={config?.features?.user_message_autoscroll}
          autoScrollAssistantMessage={
            config?.features?.assistant_message_autoscroll
          }
          autoScrollRef={autoScrollRef}
        >
          <div
            className="flex flex-col mx-auto w-full flex-grow p-4"
            style={{
              maxWidth: layoutMaxWidth
            }}
          >
            <TaskList isMobile={true} />
            <WelcomeScreen
              fileSpec={fileSpec}
              onFileUpload={onFileUpload}
              onFileUploadError={onFileUploadError}
              autoScrollRef={autoScrollRef}
            />
            <MessagesContainer navigate={navigate} />
          </div>
        </ScrollContainer>
        <div
          className="flex flex-col mx-auto w-full p-4 pt-0"
          style={{
            maxWidth: layoutMaxWidth
          }}
        >
          <ChatFooter
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            autoScrollRef={autoScrollRef}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default Chat;