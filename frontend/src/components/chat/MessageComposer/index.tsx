import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
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

import { useQuery } from '@/hooks/query';
import { useIsMobile } from '@/hooks/use-mobile';

import { chatSettingsOpenState } from '@/state/project';
import {
  IAttachment,
  attachmentsState,
  persistentCommandState
} from 'state/chat';

import type { IMode } from '@chainlit/react-client';
import { modesState } from '@chainlit/react-client';

import { Attachments } from './Attachments';
import CommandButtons from './CommandButtons';
import CommandButton from './CommandPopoverButton';
import Input, { InputMethods } from './Input';
import ModePicker from './ModePicker';
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
  // Track selected options for each mode: { modeId: optionId }
  const [selectedModes, setSelectedModes] = useState<Record<string, string>>({});
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const { askUser, chatSettingsInputs, disabled: _disabled } = useChatData();

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

  const isMobile = useIsMobile();

  // Get available modes from state
  const modes = useRecoilValue(modesState);

  // Set default mode options on mount or when modes change
  useEffect(() => {
    if (modes.length > 0) {
      const defaults: Record<string, string> = {};
      modes.forEach((mode: IMode) => {
        if (!selectedModes[mode.id] && mode.options.length > 0) {
          // Find default option or use first
          const defaultOption = mode.options.find(opt => opt.default) || mode.options[0];
          defaults[mode.id] = defaultOption.id;
        }
      });
      if (Object.keys(defaults).length > 0) {
        setSelectedModes(prev => ({ ...prev, ...defaults }));
      }
    }
  }, [modes]);

  // Handler for mode option selection
  const handleModeSelect = useCallback((modeId: string, optionId: string) => {
    setSelectedModes(prev => ({ ...prev, [modeId]: optionId }));
  }, []);

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
      selectedCommand?: string
    ) => {
      // Build modes dict: only include modes that have selections
      const modesDict: Record<string, string> = {};
      Object.entries(selectedModes).forEach(([modeId, optionId]) => {
        if (optionId) {
          modesDict[modeId] = optionId;
        }
      });

      const message: IStep = {
        threadId: '',
        command: selectedCommand,
        modes: Object.keys(modesDict).length > 0 ? modesDict : undefined,
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
    [user, sendMessage, autoScrollRef, selectedModes]
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
    setValue(''); // Clear the value state
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    askUser,
    attachments,
    selectedCommand,
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
      <Input
        ref={inputRef}
        id="chat-input"
        autoFocus={!isMobile}
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
          {modes.map((mode) => (
            <ModePicker
              key={mode.id}
              mode={mode}
              disabled={disabled}
              selectedOptionId={selectedModes[mode.id]}
              onOptionSelect={handleModeSelect}
            />
          ))}
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
