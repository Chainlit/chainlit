import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';

import AccentButton from 'components/atoms/buttons/accentButton';
import RegularButton from 'components/atoms/buttons/button';

import {
  chatSettingsDefaultValueSelector,
  chatSettingsState,
  chatSettingsValueState,
  sessionState
} from 'state/chat';

import FormInput, { TFormInputValue } from '../FormInput';

export default function ChatSettingsModal() {
  const session = useRecoilValue(sessionState);
  const [chatSettings, setChatSettings] = useRecoilState(chatSettingsState);
  const [chatSettingsValue, setChatSettingsValue] = useRecoilState(
    chatSettingsValueState
  );
  const chatSettingsDefaultValue = useRecoilValue(
    chatSettingsDefaultValueSelector
  );

  const formik = useFormik({
    initialValues: chatSettingsValue,
    enableReinitialize: true,
    onSubmit: async () => undefined
  });

  const handleClose = () => setChatSettings((old) => ({ ...old, open: false }));
  const handleConfirm = () => {
    setChatSettingsValue(formik.values);

    const values = mapValues(formik.values, (x: TFormInputValue) =>
      x !== '' ? x : null
    );
    session?.socket.emit('chat_settings_change', values);

    handleClose();
  };
  const handleReset = () => {
    formik.setValues(chatSettingsDefaultValue);
  };

  return (
    <Dialog
      open={chatSettings.open}
      onClose={handleClose}
      id="chat-settings-dialog"
      PaperProps={{
        sx: {
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle id="alert-dialog-title">{'Settings panel'}</DialogTitle>
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
          {chatSettings.inputs.map((input) => (
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
          Reset
        </AccentButton>
        <div style={{ flex: '1 0 0' }} />
        <RegularButton onClick={handleClose}>Cancel</RegularButton>
        <AccentButton
          id="confirm"
          variant="outlined"
          onClick={handleConfirm}
          autoFocus
        >
          Confirm
        </AccentButton>
      </DialogActions>
    </Dialog>
  );
}
