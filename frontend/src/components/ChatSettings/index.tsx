import mapValues from 'lodash/mapValues';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';

import { useChatData, useChatInteract } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Translator } from 'components/i18n';

import { chatSettingsOpenState } from 'state/project';

import { FormInput, TFormInputValue } from './FormInput';

export default function ChatSettingsModal() {
  const { chatSettingsValue, chatSettingsInputs, chatSettingsDefaultValue } =
    useChatData();

  const { updateChatSettings } = useChatInteract();
  const [chatSettingsOpen, setChatSettingsOpen] = useRecoilState(
    chatSettingsOpenState
  );

  const { handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: chatSettingsValue
  });

  // Reset form when default values change
  useEffect(() => {
    reset(chatSettingsValue);
  }, [chatSettingsValue, reset]);

  const handleClose = () => setChatSettingsOpen(false);

  const handleConfirm = handleSubmit((data) => {
    const processedValues = mapValues(data, (x: TFormInputValue) =>
      x !== '' ? x : null
    );
    updateChatSettings(processedValues);
    handleClose();
  });

  const handleReset = () => {
    reset(chatSettingsDefaultValue);
  };

  // Legacy setField compatibility layer
  const handleChange = () => {};

  const setFieldValue = (field: string, value: any) => {
    setValue(field, value);
  };

  const values = watch();

  return (
    <Dialog open={chatSettingsOpen} onOpenChange={handleClose}>
      <DialogContent
        id="chat-settings"
        className="min-w-[20vw] max-h-[85vh] overflow-y-auto flex flex-col gap-6"
      >
        <DialogHeader>
          <DialogTitle>
            <Translator path="components.organisms.chat.settings.settingsPanel" />
          </DialogTitle>
        </DialogHeader>
        {chatSettingsInputs.map((input: any) => (
          <FormInput
            key={input.id}
            element={{
              ...input,
              value: values[input.id],
              onChange: handleChange,
              setField: setFieldValue
            }}
          />
        ))}
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            <Translator path="components.organisms.chat.settings.reset" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={handleClose}>
            <Translator path="components.organisms.chat.settings.cancel" />
          </Button>
          <Button onClick={handleConfirm} id="confirm" autoFocus>
            <Translator path="components.organisms.chat.settings.confirm" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
