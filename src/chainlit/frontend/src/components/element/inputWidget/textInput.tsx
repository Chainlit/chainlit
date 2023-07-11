import { ChangeEvent } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { TextField } from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { ITextInputElement } from 'state/element';

interface Props {
  element: ITextInputElement;
}

export default function TextInput({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.initial, setValue] = useRecoilState<string>(
    sessionSettingsFamilyState(element.key)
  );

  function onTextInputChanged(
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void {
    setValue(event.target.value);

    const setting = {
      key: event.target.name,
      value: event.target.value
    };
    session?.socket.emit('settings_change', setting);
  }

  return (
    <TextField
      sx={{ mt: 2, mb: 1 }}
      name={element.key}
      label={element.label}
      value={value}
      type="input"
      onChange={onTextInputChanged}
      placeholder={element.placeholder}
    />
  );
}
