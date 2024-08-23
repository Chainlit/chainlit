import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useRecoilState } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';

import { useChatData, useChatInteract } from '@chainlit/react-client';

import { AccentButton, RegularButton } from 'components/atoms/buttons';
import { FormInput, TFormInputValue } from 'components/atoms/inputs';
import { Translator } from 'components/i18n';

import { BaseAssistant, assistantsState } from 'state/project';

interface AssistantCreationModalProps {
  open: boolean;
  handleClose: () => void;
}

export default function AssistantCreationModal({
  open,
  handleClose
}: AssistantCreationModalProps) {
  const { assistantSettingsInputs, assistantSettingsDefaultValue } =
    useChatData();
  const { createAssistant, listAssistants } = useChatInteract();
  const [, setAssistants] = useRecoilState(assistantsState);

  const formik = useFormik({
    initialValues: assistantSettingsDefaultValue,
    enableReinitialize: true,
    onSubmit: async () => undefined
  });

  const handleConfirm = async () => {
    const values = mapValues(formik.values, (x: TFormInputValue) =>
      x !== '' ? x : null
    );
    await createAssistant(values);
    const updatedAssistants = (await listAssistants()) as BaseAssistant[];
    setAssistants(updatedAssistants);
    formik.resetForm();
    handleClose();
  };

  const handleReset = () => {
    formik.resetForm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      id="assistant-creation-modal"
      PaperProps={{
        sx: {
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle id="alert-dialog-title">
        {
          <Translator path="components.organisms.assistantCreationModal.title" />
        }
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: '30vw',
            maxHeight: '90vh',
            gap: '15px'
          }}
        >
          {assistantSettingsInputs && assistantSettingsInputs.length > 0 ? (
            assistantSettingsInputs.map((input: any, index: number) => (
              <FormInput
                key={`${input.id}-${index}`}
                element={{
                  ...input,
                  value: formik.values[input.id],
                  onChange: formik.handleChange,
                  setField: formik.setFieldValue
                }}
              />
            ))
          ) : (
            <Typography>No assistant settings available.</Typography>
          )}
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
