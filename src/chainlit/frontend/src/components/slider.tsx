import { InputLabel, Stack } from '@mui/material';
import Slider, { SliderProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { white } from 'palette';

const StyledSlider = styled(Slider)({
  width: 'calc(100% - 7px)',
  color: '#c5c5d2',
  height: 3,
  '& .MuiSlider-track': {
    border: 'none'
  },
  '& .MuiSlider-thumb': {
    height: 14,
    width: 14,
    backgroundColor: white,
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit'
    },
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: '#52af77',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)'
    },
    '& > *': {
      transform: 'rotate(45deg)'
    }
  }
});

interface Props extends SliderProps {
  label: string;
}

const _Slider = ({ label, ...sliderProps }: Props) => {
  return (
    <Stack mr={1}>
      <Stack direction="row" justifyContent="space-between">
        <InputLabel>{label}</InputLabel>
        <InputLabel>{sliderProps.value}</InputLabel>
      </Stack>
      <StyledSlider {...sliderProps} />
    </Stack>
  );
};

export default _Slider;
