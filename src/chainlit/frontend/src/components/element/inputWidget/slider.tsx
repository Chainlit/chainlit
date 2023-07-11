import { useRecoilState, useRecoilValue } from 'recoil';

import { Box, Slider as MuiSlider, Typography } from '@mui/material';

import { sessionSettingsFamilyState, sessionState } from 'state/chat';
import { ISliderElement } from 'state/element';

interface Props {
  element: ISliderElement;
}

export default function Slider({ element }: Props) {
  const session = useRecoilValue(sessionState);
  const [value = element.initial, setValue] = useRecoilState<number>(
    sessionSettingsFamilyState(element.key)
  );

  const handleSliderChange = (event: any) => {
    event = event as Event & { target: { name: string } };

    setValue(event.target.value);
  };

  const handleSliderChangeCommitted = (
    event: any,
    newValue: number | number[]
  ) => {
    event = event as Event & { target: { name: string } };

    const setting = {
      key: event.target.firstElementChild.name,
      value: newValue
    };
    session?.socket.emit('settings_change', setting);
  };

  return (
    <Box sx={{ my: 1 }}>
      <Typography gutterBottom>{element.label}</Typography>
      <MuiSlider
        name={element.key}
        value={value}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderChangeCommitted}
        min={element.min}
        max={element.max}
        step={element.step}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}
