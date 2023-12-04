import { apiClient } from 'api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import {
  threadHistoryState,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';
import { ErrorBoundary, useUpload } from '@chainlit/react-components';

import SideView from 'components/atoms/element/sideView';
import ChatProfiles from 'components/molecules/chatProfiles';
import { TaskList } from 'components/molecules/tasklist/TaskList';

import { IAttachment, attachmentsState } from 'state/chat';
import { projectSettingsState, sideViewState } from 'state/project';

import Messages from './Messages';
import DropScreen from './dropScreen';
import InputBox from './inputBox';

const Chat = () => {
  const projectSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setThreads = useSetRecoilState(threadHistoryState);
  const sideViewElement = useRecoilValue(sideViewState);

  const [autoScroll, setAutoScroll] = useState(true);
  const { error, disabled } = useChatData();
  const { uploadFile } = useChatInteract();

  const fileSpec = useMemo(() => ({ max_size_mb: 500 }), []);

  const onFileUpload = useCallback((payloads: File[]) => {
    const attachements: IAttachment[] = payloads.map((file) => {
      const id = uuidv4();

      const { xhr, promise } = uploadFile(apiClient, file, (progress) => {
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
  }, []);

  const onFileUploadError = useCallback(
    () => (error: string) => toast.error(error),
    []
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

  const enableMultiModalUpload =
    !disabled && projectSettings?.features?.multi_modal;

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
      {upload ? (
        <>
          <input id="#upload-drop-input" {...upload.getInputProps()} />
          {upload?.isDragActive ? <DropScreen /> : null}
        </>
      ) : null}
      <SideView>
        <Box my={1} />
        {error && (
          <Box
            sx={{
              width: '100%',
              maxWidth: '60rem',
              mx: 'auto',
              my: 2
            }}
          >
            <Alert sx={{ mx: 2 }} id="session-error" severity="error">
              Could not reach the server.
            </Alert>
          </Box>
        )}
        <TaskList isMobile={true} />
        <ErrorBoundary>
          <ChatProfiles />
          <Messages
            autoScroll={autoScroll}
            projectSettings={projectSettings}
            setAutoScroll={setAutoScroll}
          />
          <InputBox
            fileSpec={fileSpec}
            onFileUpload={onFileUpload}
            onFileUploadError={onFileUploadError}
            setAutoScroll={setAutoScroll}
            projectSettings={projectSettings}
          />
        </ErrorBoundary>
      </SideView>
      {sideViewElement ? null : <TaskList isMobile={false} />}
    </Box>
  );
};

export default Chat;
