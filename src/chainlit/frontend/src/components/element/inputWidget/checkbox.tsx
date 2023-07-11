import { useRecoilState, useRecoilValue } from 'recoil';

import { FormControlLabel, Checkbox as MuiCheckbox } from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { ICheckboxElement } from 'state/element';

interface Props {
  element: ICheckboxElement;
}

export default function Checkbox({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.initial, setValue] = useRecoilState<boolean>(
    sessionSettingsFamilyState(element.key)
  );

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.checked);

    const setting = {
      key: event.target.name,
      value: event.target.checked
    };
    session?.socket.emit('settings_change', setting);
  };

  return (
    <FormControlLabel
      control={
        <MuiCheckbox
          name={element.key}
          checked={value}
          onChange={onCheckboxChange}
        />
      }
      label={element.label}
    />
  );
}
