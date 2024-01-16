import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useRecoilState } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';

import { useChatData, useChatInteract } from '@chainlit/react-client';
import {
  AccentButton,
  FormInput,
  RegularButton,
  TFormInputValue
} from '@chainlit/react-components';

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
    <Dialog
      open={chatSettingsOpen}
      onClose={handleClose}
      id="chat-settings-dialog"
      PaperProps={{
        sx: {
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle id="alert-dialog-title">
        {<Translator path="components.organisms.chat.settings.settingsPanel" />}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: '20vw',
            maxHeight: '70vh',
            gap: '15px'
          }}
        >
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <AccentButton onClick={handleReset} color="primary" variant="outlined">
          <Translator path="components.organisms.chat.settings.reset" />
        </AccentButton>
        <div style={{ flex: '1 0 0' }} />
        <RegularButton onClick={handleClose}>
          <Translator path="components.organisms.chat.settings.cancel" />
        </RegularButton>
        <AccentButton
          id="confirm"
          variant="outlined"
          onClick={handleConfirm}
          autoFocus
        >
          <Translator path="components.organisms.chat.settings.confirm" />
        </AccentButton>
      </DialogActions>
    </Dialog>
  );
}
