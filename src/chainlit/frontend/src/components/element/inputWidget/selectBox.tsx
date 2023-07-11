import { useRecoilState, useRecoilValue } from 'recoil';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { ISelectBoxElement } from 'state/element';

interface Props {
  element: ISelectBoxElement;
}

export default function SelectBox({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.options[element.initial_index], setValue] =
    useRecoilState<string>(sessionSettingsFamilyState(element.key));

  const handleSelectBoxChange = (event: SelectChangeEvent) => {
    setValue(event.target.value);

    const setting = {
      key: event.target.name,
      value: event.target.value
    };
    session?.socket.emit('settings_change', setting);
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <FormControl fullWidth>
        <InputLabel id={element.key + '-label'}>{element.label}</InputLabel>
        <Select
          labelId={element.key + '-label'}
          name={element.key}
          value={value}
          label={element.label}
          onChange={handleSelectBoxChange}
        >
          {element.options.map((option, i) => (
            <MenuItem key={i} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
