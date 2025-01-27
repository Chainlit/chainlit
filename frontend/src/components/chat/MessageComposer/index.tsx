import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  FileSpec,
  ICommand,
  IStep,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';

import { chatSettingsOpenState } from '@/state/project';
import { IAttachment, attachmentsState } from 'state/chat';

import { Attachments } from './Attachments';
import CommandButton from './CommandButton';
import Input, { InputMethods } from './Input';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';
import VoiceButton from './VoiceButton';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

export default function MessageComposer({
  fileSpec,
  onFileUpload,
  onFileUploadError,
  setAutoScroll
}: Props) {
  const inputRef = useRef<InputMethods>(null);
  const [value, setValue] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<ICommand>();
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const { askUser, chatSettingsInputs, disabled: _disabled } = useChatData();

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

  const onPaste = useCallback((event: ClipboardEvent) => {
    if (event.clipboardData && event.clipboardData.items) {
      const items = Array.from(event.clipboardData.items);

      // Attempt to handle text data first
      const textData = event.clipboardData.getData('text/plain');
      if (textData) {
        // Skip file handling if text data is present
        return;
      }

      event.preventDefault();

      // If no text data, check for files (e.g., images)
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            onFileUpload([file]);
          }
        }
      });
    }
  }, []);

  const onSubmit = useCallback(
    async (
      msg: string,
      attachments?: IAttachment[],
      selectedCommand?: string
    ) => {
      const message: IStep = {
        threadId: '',
        command: selectedCommand,
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString()
      };

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      setAutoScroll(true);
      sendMessage(message, fileReferences);
    },
    [user, sendMessage]
  );

  const onReply = useCallback(
    async (msg: string) => {
      const message: IStep = {
        threadId: '',
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString()
      };

      replyMessage(message);
      setAutoScroll(true);
    },
    [user, replyMessage]
  );

  const submit = useCallback(() => {
    if (disabled || (value === '' && attachments.length === 0)) {
      return;
    }
    if (askUser) {
      onReply(value);
    } else {
      onSubmit(value, attachments, selectedCommand?.id);
    }
    setAttachments([]);
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    setValue,
    askUser,
    attachments,
    selectedCommand,
    setAttachments,
    onSubmit
  ]);

  return (
    <div className="bg-accent dark:bg-card rounded-3xl p-3 px-4 w-full min-h-24 flex flex-col">
      {attachments.length > 0 ? (
        <div className="mb-1">
          <Attachments />
        </div>
      ) : null}
      <Input
        ref={inputRef}
        id="chat-input"
        autoFocus
        selectedCommand={selectedCommand}
        setSelectedCommand={setSelectedCommand}
        onChange={setValue}
        onPaste={onPaste}
        onEnter={submit}
        placeholder={t('chat.input.placeholder')}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center -ml-1.5">
          <UploadButton
            disabled={disabled}
            fileSpec={fileSpec}
            onFileUploadError={onFileUploadError}
            onFileUpload={onFileUpload}
          />
          <CommandButton
            disabled={disabled}
            onCommandSelect={setSelectedCommand}
          />
          {chatSettingsInputs.length > 0 && (
            <Button
              id="chat-settings-open-modal"
              disabled={disabled}
              onClick={() => setChatSettingsOpen(true)}
              className="hover:bg-muted"
              variant="ghost"
              size="icon"
            >
              <Settings className="!size-6" />
            </Button>
          )}
          <VoiceButton disabled={disabled} />
        </div>
        <div className="flex items-center gap-1">
          <SubmitButton onSubmit={submit} disabled={disabled || !value} />
        </div>
      </div>
    </div>
  );
}
