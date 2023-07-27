import { useFormik } from 'formik';
import mapValues from 'lodash/mapValues';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText
} from '@mui/material';

import AccentButton from 'components/atoms/buttons/accentButton';
import RegularButton from 'components/atoms/buttons/button';
import Switch from 'components/atoms/switch';
import InputLabel from 'components/molecules/inputLabel';
import SelectInput from 'components/organisms/inputs/selectInput';
import TextInput from 'components/organisms/inputs/textInput';
import Slider from 'components/organisms/slider';

import {
  IInputWidget,
  chatSettingsDefaultValueSelector,
  chatSettingsState,
  chatSettingsValueState,
  sessionState
} from 'state/chat';

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

    const values = mapValues(formik.values, (x: unknown) =>
      x !== '' ? x : null
    );
    session?.socket.emit('chat_settings_change', values);

    handleClose();
  };
  const handleReset = () => {
    formik.setValues(chatSettingsDefaultValue);
  };

  const renderInputWidget = (element: IInputWidget): JSX.Element | null => {
    switch (element.type) {
      case 'switch':
        return (
          <Box key={element.key}>
            <InputLabel
              id={element.key}
              label={element.label}
              tooltip={element.tooltip}
            />
            <Switch
              inputProps={{
                id: element.key,
                name: element.key
              }}
              checked={formik.values[element.key] ?? false}
              onChange={formik.handleChange}
            />
            <FormHelperText>{element.description}</FormHelperText>
          </Box>
        );
      case 'slider':
        return (
          <Box key={element.key}>
            <Slider
              id={element.key}
              name={element.key}
              label={element.label}
              tooltip={element.tooltip}
              min={element.min}
              max={element.max}
              step={element.step}
              value={formik.values[element.key] ?? 0}
              onChange={formik.handleChange}
            />
            <FormHelperText>{element.description}</FormHelperText>
          </Box>
        );
      case 'select':
        return (
          <SelectInput
            key={element.key}
            id={element.key}
            name={element.key}
            label={element.label}
            tooltip={element.tooltip}
            description={element.description}
            items={element.options}
            value={formik.values[element.key] ?? ''}
            onChange={formik.handleChange}
          />
        );
      case 'textinput':
        return (
          <TextInput
            key={element.key}
            id={element.key}
            name={element.key}
            label={element.label}
            tooltip={element.tooltip}
            description={element.description}
            placeholder={element.placeholder}
            value={formik.values[element.key] ?? ''}
            onChange={formik.handleChange}
          />
        );
    }
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
          {chatSettings.widgets.map((widget) => renderInputWidget(widget))}
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
