import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
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

import { useQuery } from '@/hooks/query';
import { useIsMobile } from '@/hooks/use-mobile';

import { chatSettingsOpenState } from '@/state/project';
import {
  IAttachment,
  attachmentsState,
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
  const [selectedCommand, setSelectedCommand] = useRecoilState(
    persistentCommandState
  );
  const [selectedSetting, setSelectedSetting] = useState<any>(undefined);
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage, updateChatSettings } = useChatInteract();
  const { askUser, chatSettingsInputs, disabled: _disabled } = useChatData();

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

  const isMobile = useIsMobile();

  let promptValue = '';
  try {
    const query = useQuery();
    promptValue = query.get('prompt') || '';
  } catch {
    console.warn('Could not parse query parameters');
  }

  const [promptUsed, setPromptUsed] = useState(false);

  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      if (event.clipboardData && event.clipboardData.items) {
        const items = Array.from(event.clipboardData.items);

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
    },
    [onFileUpload]
  );

  const onSubmit = useCallback(
    async (
      msg: string,
      attachments?: IAttachment[],
      selectedCommand?: string,
      selectedSetting?: any
    ) => {
      // Apply chat setting if selected
      if (selectedSetting) {
        const settingValue = {
          [selectedSetting.id]:
            selectedSetting.selectedValue !== undefined
              ? selectedSetting.selectedValue
              : selectedSetting.initial
        };
        updateChatSettings(settingValue);
      }

      const message: IStep = {
        threadId: '',
        command: selectedCommand,
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString(),
        metadata: { location: window.location.href }
      };

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
      sendMessage(message, fileReferences);
    },
    [user, sendMessage, autoScrollRef, updateChatSettings]
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
        metadata: { location: window.location.href }
      };

      replyMessage(message);
      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
    },
    [user, replyMessage, autoScrollRef]
  );

  const submit = useCallback(() => {
    if (
      disabled ||
      (value.trim() === '' &&
        attachments.length === 0 &&
        !selectedCommand &&
        !selectedSetting)
    ) {
      return;
    }

    if (askUser) {
      onReply(value);
    } else {
      onSubmit(value, attachments, selectedCommand?.id, selectedSetting);
    }

    setAttachments([]);
    setSelectedSetting(undefined);
    setValue(''); // Clear the value state
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    askUser,
    attachments,
    selectedCommand,
    selectedSetting,
    setAttachments,
    onSubmit,
    onReply
  ]);

  useEffect(() => {
    if (inputRef.current && promptValue && !promptUsed) {
      const prompt = promptValue;
      if (prompt) {
        if (prompt.length > 1000) {
          inputRef.current?.setValueExtern(prompt.slice(0, 1000));
        } else {
          inputRef.current?.setValueExtern(prompt);
        }
        setPromptUsed(true);
      }
    }
  }, [promptValue, promptUsed]);

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
      {selectedSetting && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full flex items-center gap-1">
            <span>
              @{selectedSetting.label || selectedSetting.id}
              {selectedSetting.selectedValue !== undefined &&
                selectedSetting.selectedLabel && (
                  <span className="text-blue-600 dark:text-blue-400">
                    /{selectedSetting.selectedLabel}
                  </span>
                )}
            </span>
            <button
              onClick={() => setSelectedSetting(undefined)}
              className="hover:bg-blue-500/20 rounded-full p-0.5"
            >
              ×
            </button>
          </span>
        </div>
      )}
      <Input
        ref={inputRef}
        id="chat-input"
        autoFocus={!isMobile}
        selectedCommand={selectedCommand}
        setSelectedCommand={setSelectedCommand}
        selectedSetting={selectedSetting}
        setSelectedSetting={setSelectedSetting}
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
              (!value.trim() &&
                !selectedCommand &&
                !selectedSetting &&
                attachments.length === 0)
            }
          />
        </div>
      </div>
    </div>
  );
}
