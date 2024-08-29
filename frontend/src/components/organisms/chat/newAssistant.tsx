import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useContext, useState } from 'react';
import { useRecoilState } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';

import { ChainlitContext } from '@chainlit/react-client';
import { useChatData, useChatInteract } from '@chainlit/react-client';

import { AccentButton, RegularButton } from 'components/atoms/buttons';
import { FormInput, TFormInputValue } from 'components/atoms/inputs';
import { Translator } from 'components/i18n';

import { Assistant, assistantsState } from 'state/project';

interface AssistantCreationModalProps {
  open: boolean;
  handleClose: () => void;
  startValues: Record<string, any> | null;
}

export default function AssistantCreationModal({
  open,
  handleClose,
  startValues
}: AssistantCreationModalProps) {
  const apiClient = useContext(ChainlitContext);
  const { assistantSettingsInputs, assistantSettingsDefaultValue } =
    useChatData();
  const { createAssistant, listAssistants, uploadFile } = useChatInteract();
  const [, setAssistants] = useRecoilState(assistantsState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: startValues ? startValues : assistantSettingsDefaultValue,
    // initialValues: { "name": 'toto', "markdown_description": 'toto', "icon": "pfp.png" },
    enableReinitialize: true,
    onSubmit: async () => undefined
  });

  const handleConfirm = async () => {
    const values: any = mapValues(
      formik.values,
      (x: TFormInputValue, key: string) => {
        if (key === 'icon') {
          return x instanceof File ? x : formik.values.icon;
        }
        return x !== '' ? x : null;
      }
    );

    // Check for required fields
    if (!values.name) {
      setErrorMessage('Name is mandatory');
      return;
    }
    if (!values.markdown_description) {
      setErrorMessage('Description is mandatory');
      return;
    }

    // Handle icon upload or removal
    if (formik.values.icon instanceof File) {
      const newFileName = `/avatars/${formik.values.icon.name}`;
      const { promise } = uploadFile(
        formik.values.icon,
        () => {},
        `${newFileName}`
      );
      try {
        await promise;
        // remove the .png from the file name (keep all characters before the last dot)
        values.icon = newFileName.split('.').slice(0, -1).join('.');
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        return;
      }
    }

    try {
      const newAssistant = {
        input_widgets: assistantSettingsInputs,
        settings_values: values
      };
      await createAssistant(newAssistant);
      const updatedAssistants = (await listAssistants()) as Assistant[];
      setAssistants(updatedAssistants);
      formik.resetForm();
      setErrorMessage(null);
      handleClose();
    } catch (error) {
      console.error('Failed to create assistant:', error);
      setErrorMessage('Failed to create assistant. Please try again.');
    }
    console.log(assistantSettingsDefaultValue);
  };

  const handleReset = () => {
    formik.resetForm();
    setErrorMessage(null);
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
            minWidth: '50vh',
            maxHeight: '90vh',
            gap: '15px',
            margin: '0, 20px'
          }}
        >
          {assistantSettingsInputs && assistantSettingsInputs.length > 0 ? (
            assistantSettingsInputs.map((input: any, index: number) => (
              <FormInput
                key={`${input.id}-${index}`}
                element={{
                  ...input,
                  value: formik.values[input.id],
                  onChange:
                    input.id === 'icon'
                      ? (file: File | null) => {
                          formik.setFieldValue(input.id, file);
                        }
                      : formik.handleChange,
                  setField: formik.setFieldValue,
                  type: input.id === 'icon' ? 'fileupload' : input.type,
                  initialPreview:
                    input.id === 'icon' &&
                    startValues?.icon &&
                    startValues.icon != ''
                      ? apiClient.buildEndpoint(`/avatars/${startValues.icon}`)
                      : // else default avatar
                        undefined,
                  currentFileName:
                    input.id === 'icon' && startValues?.icon
                      ? startValues.icon
                      : undefined
                }}
              />
            ))
          ) : (
            <Typography>No assistant settings available.</Typography>
          )}
          {errorMessage && (
            <Box
              sx={{
                backgroundColor: 'error.main',
                color: 'error.contrastText',
                padding: 2,
                borderRadius: 1,
                marginTop: 2
              }}
            >
              {errorMessage}
            </Box>
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
