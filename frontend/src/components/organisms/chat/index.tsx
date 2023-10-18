import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { Alert, Box } from '@mui/material';

import {
  ErrorBoundary,
  IFileResponse,
  useChat,
  useUpload
} from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import ChatProfiles from 'components/molecules/chatProfiles';
import { TaskList } from 'components/molecules/tasklist/TaskList';

import { attachmentsState } from 'state/chat';
import { conversationsHistoryState } from 'state/conversations';
import { projectSettingsState, sideViewState } from 'state/project';

import Messages from './Messages';
import DropScreen from './dropScreen';
import InputBox from './inputBox';

const Chat = () => {
  const projectSettings = useRecoilValue(projectSettingsState);
  const setAttachments = useSetRecoilState(attachmentsState);
  const setConversations = useSetRecoilState(conversationsHistoryState);
  const sideViewElement = useRecoilValue(sideViewState);

  const [autoScroll, setAutoScroll] = useState(true);

  const { error, disabled } = useChat();

  const fileSpec = { max_size_mb: 20 };
  const onFileUpload = (payloads: IFileResponse[]) => {
    const fileElements = payloads.map((file) => ({
      id: uuidv4(),
      type: 'file' as const,
      display: 'inline' as const,
      name: file.name,
      mime: file.type,
      content: file.content
    }));
    setAttachments((prev) => prev.concat(fileElements));
  };

  const onFileUploadError = (error: string) => toast.error(error);

  const upload = useUpload({
    spec: fileSpec,
    onResolved: onFileUpload,
    onError: onFileUploadError,
    options: { noClick: true }
  });

  useEffect(() => {
    setConversations((prev) => ({
      ...prev,
      currentConversationId: undefined
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
