import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import Alert from '@chainlit/app/src/components/Alert';
import ChatSettingsModal from '@chainlit/app/src/components/ChatSettings';
import { ErrorBoundary } from '@chainlit/app/src/components/ErrorBoundary';
import { TaskList } from '@chainlit/app/src/components/Tasklist';
import ChatFooter from '@chainlit/app/src/components/chat/Footer';
import MessagesContainer from '@chainlit/app/src/components/chat/MessagesContainer';
import ScrollContainer from '@chainlit/app/src/components/chat/ScrollContainer';
import Translator from '@chainlit/app/src/components/i18n/Translator';
import { useLayoutMaxWidth } from '@chainlit/app/src/hooks/useLayoutMaxWidth';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { IAttachment, attachmentsState } from '@chainlit/app/src/state/chat';
import {
  threadHistoryState,
  useChatData,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import WelcomeScreen from '@/components/WelcomeScreen';
import ElementSideView from 'components/ElementSideView';

const Chat = () => {
  const { config } = useConfig();
  const layoutMaxWidth = useLayoutMaxWidth();
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const autoScrollRef = useRef(true);
  const { error, disabled, callFn } = useChatData();
  const { uploadFile } = useChatInteract();
  const uploadFileRef = useRef(uploadFile);

  const fileSpec = useMemo(
    () => ({
      max_size_mb:
        config?.features?.spontaneous_file_upload?.max_size_mb || 500,
      max_files: config?.features?.spontaneous_file_upload?.max_files || 20,
      accept: config?.features?.spontaneous_file_upload?.accept || ['*/*']
    }),
    [config]
  );

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
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
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
            toast.info(`Cancelled upload of ${file.name}`);
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

  useEffect(() => {
    setThreads((prev) => ({
      ...prev,
      currentThreadId: undefined
    }));
  }, []);

  const enableAttachments =
    !disabled && config?.features?.spontaneous_file_upload?.enabled;

  return (
    <div
      {...(enableAttachments
        ? upload?.getRootProps({ className: 'dropzone' })
        : {})}
      // Disable the onFocus and onBlur events in react-dropzone to avoid interfering with child trigger events
      onBlur={undefined}
      onFocus={undefined}
      className="flex w-full h-full flex-col overflow-y-auto"
    >
      {upload ? (
        <input id="#upload-drop-input" {...upload.getInputProps()} />
      ) : null}
      <div className="flex-grow flex flex-col overflow-y-auto">
        {error ? (
          <div className="w-full mx-auto my-2">
            <Alert className="mx-2" id="session-error" variant="error">
              <Translator path="common.status.error.serverConnection" />
            </Alert>
          </div>
        ) : null}
        <ChatSettingsModal />
        <ErrorBoundary>
          <ScrollContainer
            autoScrollUserMessage={config?.features?.user_message_autoscroll}
            autoScrollRef={autoScrollRef}
          >
            <div
              className="flex flex-col mx-auto w-full flex-grow px-4 pt-4"
              style={{
                maxWidth: layoutMaxWidth
              }}
            >
              <TaskList isMobile={true} isCopilot />
              <WelcomeScreen />
              <MessagesContainer />
            </div>
          </ScrollContainer>
          <div
            className="flex flex-col mx-auto w-full px-4 pb-4"
            style={{
              maxWidth: layoutMaxWidth
            }}
          >
            <ChatFooter
              showIfEmptyThread
              fileSpec={fileSpec}
              onFileUpload={onFileUpload}
              onFileUploadError={onFileUploadError}
              autoScrollRef={autoScrollRef}
            />
          </div>
        </ErrorBoundary>
      </div>
      <ElementSideView />
    </div>
  );
};

export default Chat;
