import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'; // Added React and useEffect
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil'; // Added useRecoilValue
import { v4 as uuidv4 } from 'uuid';

import {
  FileSpec,
  FileSpec,
  IStep,
  useAuth,
  useChatData,
  useChatInteract,
  IElement // Assuming IElement is the base type for elements from useChatData
} from '@chainlit/react-client';
import { ICustomWidgetElement, CustomWidgetProps } from '@/types/widgets'; // Import custom widget types
import CustomWidgetRenderer from '@/components/widgets/CustomWidgetRenderer'; // Import the renderer

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';

import { chatSettingsOpenState } from '@/state/project';
import {
  IAttachment,
  attachmentsState,
  persistentCommandState,
  customWidgetDefinitionsState, // Import custom widget states
  customWidgetValuesState
} from '@/state/chat';

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
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const { elements, askUser, chatSettingsInputs, disabled: _disabled } = useChatData(); // Added elements
  const [widgetDefs, setWidgetDefs] = useRecoilState(customWidgetDefinitionsState);
  const [widgetValues, setWidgetValues] = useRecoilState(customWidgetValuesState); // Renamed for clarity

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

  useEffect(() => {
    // Filter for custom elements intended for the composer
    const composerWidgets = elements.filter(
      (el): el is ICustomWidgetElement => // Type guard
        el.type === 'custom' &&
        el.forId === 'COMPOSER_WIDGET' &&
        // Ensure props is an object and has widgetType, which implies it's one of our custom widgets
        typeof el.props === 'object' && el.props !== null && 'widgetType' in el.props
    ) as ICustomWidgetElement[]; // Cast to our specific type

    setWidgetDefs(composerWidgets);

    // Initialize values if not already set
    setWidgetValues(prevValues => {
      const newValues = { ...prevValues };
      composerWidgets.forEach(widgetDef => {
        const props = widgetDef.props as CustomWidgetProps; // Cast to CustomWidgetProps
        if (props.id && !(props.id in newValues) && props.initialValue !== undefined) {
          newValues[props.id] = props.initialValue;
        }
      });
      return newValues;
    });
  }, [elements, setWidgetDefs, setWidgetValues]);

  const currentWidgetValues = useRecoilValue(customWidgetValuesState);

  const handleWidgetChange = (widgetId: string, newValue: any) => {
    setWidgetValues(prev => ({
      ...prev,
      [widgetId]: newValue
    }));
    // If real-time backend update is needed, this is where it would be triggered.
    // For now, we just update local Recoil state.
  };

  const onPaste = useCallback((event: ClipboardEvent) => {
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
        createdAt: new Date().toISOString(),
        metadata: { location: window.location.href } // Base metadata, always an object
      };

      // Add custom widget values to message.metadata
      // metadata is already guaranteed to be an object here.
      if (Object.keys(currentWidgetValues).length > 0) {
        message.metadata.custom_widgets = { ...currentWidgetValues };
      }

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
      sendMessage(message, fileReferences);
    },
    [user, sendMessage, currentWidgetValues] // Added currentWidgetValues
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
        metadata: { location: window.location.href } // Base metadata, always an object
      };

      // Add custom widget values to message.metadata
      // metadata is already guaranteed to be an object here.
      if (Object.keys(currentWidgetValues).length > 0) {
        message.metadata.custom_widgets = { ...currentWidgetValues };
      }

      replyMessage(message);
      if (autoScrollRef) {
        autoScrollRef.current = true;
      }
    },
    [user, replyMessage, currentWidgetValues] // Added currentWidgetValues
  );

  const submit = useCallback(() => {
    if (
      disabled ||
      (value === '' && attachments.length === 0 && !selectedCommand)
    ) {
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
        {/* Custom Input Widgets Area */}
        <div className="flex items-center flex-wrap gap-1 py-1"> {/* Added py-1 for some spacing */}
          {widgetDefs.map(widgetDef => (
            <CustomWidgetRenderer
              key={widgetDef.props.id} // Use props.id from widget config
              element={widgetDef}
              value={currentWidgetValues[widgetDef.props.id]}
              onChange={handleWidgetChange}
            />
          ))}
        </div>
        <div className="flex items-center -ml-1.5"> {/* This div now contains only the buttons */}
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
          {/* Removed the custom widgets from here as they are moved above */}
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
          <McpButton disabled={disabled} />
          <VoiceButton disabled={disabled} />
          <CommandButtons
            disabled={disabled}
            selectedCommandId={selectedCommand?.id}
            onCommandSelect={setSelectedCommand}
          />
        </div>
        <div className="flex items-center gap-1"> {/* Submit button remains at the far right */}
          <SubmitButton
            onSubmit={submit}
            disabled={disabled || (!value.trim() && !selectedCommand)}
          />
        </div>
      </div>
    </div>
  );
}
