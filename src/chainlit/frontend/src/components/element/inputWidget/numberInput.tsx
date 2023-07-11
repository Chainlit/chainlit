import { ChangeEvent } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { TextField } from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { INumberInputElement } from 'state/element';

interface Props {
  element: INumberInputElement;
}

export default function NumberInput({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.initial, setValue] = useRecoilState<string>(
    sessionSettingsFamilyState(element.key)
  );
  const regex = element.decimal
    ? /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/
    : /^[0-9]+$/;

  function onNumberInputChanged(
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void {
    if (event.target.value === '' || regex.test(event.target.value)) {
      setValue(event.target.value);

      const setting = {
        key: event.target.name,
        value: parseFloat(event.target.value) ?? ''
      };
      session?.socket.emit('settings_change', setting);
    } else {
      event.preventDefault();
    }
  }

  return (
    <TextField
      sx={{ mt: 2, mb: 1 }}
      name={element.key}
      label={element.label}
      value={value}
      type="text"
      onChange={onNumberInputChanged}
      placeholder={element.placeholder}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]'
      }}
    />
  );
}
