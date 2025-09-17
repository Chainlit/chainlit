import { MutableRefObject, useCallback, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  FileSpec,
  IStep,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'components/i18n/Translator';

import { chatSettingsOpenState } from '@/state/project';
import {
  IAttachment,
  attachmentsState,
  chatModeState,
  persistentCommandState
} from 'state/chat';

import { Attachments } from './Attachments';
import CommandButtons from './CommandButtons';
import CommandButton from './CommandPopoverButton';
import Input, { InputMethods } from './Input';
import McpButton from './Mcp';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';
import VoiceButton from './VoiceButton';
import WebSearchButton from './WebSearchButton';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  autoScrollRef: MutableRefObject<boolean>;
}

export default function MessageComposer({
  fileSpec,
  onFileUpload,
  onFileUploadError,
  autoScrollRef
}: Props) {
  const inputRef = useRef<InputMethods>(null);
  const [value, setValue] = useState('');
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [selectedCommand, setSelectedCommand] = useRecoilState(
    persistentCommandState
  );
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const { askUser, chatSettingsInputs, disabled: _disabled } = useChatData();

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

  const selectedMode = useRecoilValue(chatModeState);

  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      if (event.clipboardData && event.clipboardData.items) {
        const items = Array.from(event.clipboardData.items);

        items.forEach((item) => {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              onFileUpload([file]);
            }
          }
        });
      }
    },
    [onFileUpload]
  );

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
        createdAt: new Date().toISOString(),
        metadata: {
          location: window.location.href,
          mode: selectedMode // <--- ИСПРАВЛЕНО (1): Добавлен режим в onSubmit
        }
      };

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
      sendMessage(message, fileReferences);
    },
    [user, sendMessage, autoScrollRef, selectedMode] // <--- ИСПРАВЛЕНО (2): Добавлен selectedMode в зависимости
  );

  const onReply = useCallback(
    async (msg: string) => {
      const message: IStep = {
        threadId: '',
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString(),
        metadata: {
          location: window.location.href,
          mode: selectedMode // <--- ИСПРАВЛЕНО (3): Режим перенесен в metadata
        }
      };

      replyMessage(message);
      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
    },
    [user, replyMessage, autoScrollRef, selectedMode] // <--- ИСПРАВЛЕНО (4): sendMessage заменен на replyMessage
  );

  const submit = useCallback(() => {
    if (
      disabled ||
      (value.trim() === '' && attachments.length === 0 && !selectedCommand)
    ) {
      return;
    }

    if (askUser) {
      onReply(value);
    } else {
      onSubmit(value, attachments, selectedCommand?.id);
    }

    setAttachments([]);
    setValue('');
    setIsWebSearchEnabled(false);
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    askUser,
    attachments,
    selectedCommand,
    isWebSearchEnabled,
    setAttachments,
    onSubmit,
    onReply
  ]);

  return (
    <div
      id="message-composer"
      className="bg-accent dark:bg-card rounded-3xl p-3 px-4 w-full min-h-24 flex flex-col"
    >
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
          <VoiceButton disabled={disabled} />
          <UploadButton
            disabled={disabled}
            fileSpec={fileSpec}
            onFileUploadError={onFileUploadError}
            onFileUpload={onFileUpload}
          />
          <WebSearchButton
            disabled={disabled}
            value={isWebSearchEnabled}
            onChange={setIsWebSearchEnabled}
          />
          {chatSettingsInputs.length > 0 && (
            <Button
              id="chat-settings-open-modal"
              disabled={disabled}
              onClick={() => setChatSettingsOpen(true)}
              className="hover:bg-muted rounded-full"
              variant="ghost"
              size="icon"
            >
              <Settings className="!size-6" />
            </Button>
          )}
          <McpButton disabled={disabled} />
          <CommandButton
            disabled={disabled}
            selectedCommandId={selectedCommand?.id}
            onCommandSelect={setSelectedCommand}
          />
          <CommandButtons
            disabled={disabled}
            selectedCommandId={selectedCommand?.id}
            onCommandSelect={setSelectedCommand}
          />
        </div>
        <div className="flex items-center gap-1">
          <SubmitButton
            onSubmit={submit}
            disabled={
              disabled ||
              (!value.trim() && !selectedCommand && attachments.length === 0)
            }
          />
        </div>
      </div>
    </div>
  );
}
