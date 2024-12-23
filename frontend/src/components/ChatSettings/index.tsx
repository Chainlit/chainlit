import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useRecoilState } from 'recoil';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useChatData, useChatInteract } from '@chainlit/react-client';

import { FormInput, TFormInputValue } from './FormInput';
import { Translator } from 'components/i18n';

import { chatSettingsOpenState } from 'state/project';

export default function ChatSettingsModal() {
  const { chatSettingsValue, chatSettingsInputs, chatSettingsDefaultValue } =
    useChatData();

  const { updateChatSettings } = useChatInteract();
  const [chatSettingsOpen, setChatSettingsOpen] = useRecoilState(
    chatSettingsOpenState
  );

  const formik = useFormik({
    initialValues: chatSettingsValue,
    enableReinitialize: true,
    onSubmit: async () => undefined
  });

  const handleClose = () => setChatSettingsOpen(false);
  const handleConfirm = () => {
    const values = mapValues(formik.values, (x: TFormInputValue) =>
      x !== '' ? x : null
    );
    updateChatSettings(values);

    handleClose();
  };
  const handleReset = () => {
    formik.setValues(chatSettingsDefaultValue);
  };

  return (
<Dialog open={chatSettingsOpen} onOpenChange={handleClose}>
<DialogContent className="min-w-[20vw] flex flex-col gap-4">

      <DialogHeader>
        <DialogTitle>
          <Translator path="components.organisms.chat.settings.settingsPanel" />
        </DialogTitle>
      </DialogHeader>
      <div className='flex flex-col gap-6'>
        {chatSettingsInputs.map((input: any) => (
          <FormInput
            key={input.id}
            element={{
              ...input,
              value: formik.values[input.id],
              onChange: formik.handleChange,
              setField: formik.setFieldValue
            }}
          />
        ))}
        </div>
              <DialogFooter>
        <Button 
          variant="outline" 
          onClick={handleReset}
        >
          <Translator path="components.organisms.chat.settings.reset" />
        </Button>
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          onClick={handleClose}
        >
          <Translator path="components.organisms.chat.settings.cancel" />
        </Button>
        <Button 
          onClick={handleConfirm}
          id="confirm"
          autoFocus
        >
          <Translator path="components.organisms.chat.settings.confirm" />
        </Button>
      </DialogFooter>
      </DialogContent>


    </Dialog>
  );
}
