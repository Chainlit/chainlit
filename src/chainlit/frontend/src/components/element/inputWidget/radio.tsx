import { useRecoilState, useRecoilValue } from 'recoil';

import {
  Box,
  FormControlLabel,
  FormLabel,
  Radio as MuiRadio,
  RadioGroup
} from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { IRadioElement } from 'state/element';

interface Props {
  element: IRadioElement;
}

export default function Checkbox({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.options[element.initial_index], setValue] =
    useRecoilState<string>(sessionSettingsFamilyState(element.key));

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);

    const setting = {
      key: event.target.name,
      value: event.target.value
    };
    session?.socket.emit('settings_change', setting);
  };

  return (
    <Box sx={{ my: 1 }}>
      <FormLabel>{element.label}</FormLabel>
      <RadioGroup value={value} name={element.key} onChange={handleRadioChange}>
        {element.options.map((option, i) => (
          <FormControlLabel
            key={i}
            value={option}
            control={<MuiRadio />}
            label={option}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
