import { grey } from 'palette';

import { Stack } from '@mui/material';
import Slider, { SliderProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

import InputLabel from 'components/molecules/inputLabel';

const StyledSlider = styled(Slider)(({ theme }) => {
  const isLightMode = theme.palette.mode === 'light';

  return {
    width: 'calc(100% - 7px)',
    color: grey[isLightMode ? 300 : 850],
    height: 3,
    '& .MuiSlider-track': {
      border: 'none',
      color: grey[500]
    },
    '& .MuiSlider-thumb': {
      height: 15,
      width: 15,
      backgroundColor: isLightMode ? grey[600] : 'white',
      border: `4px solid ${isLightMode ? grey[300] : grey[800]}`,
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
  };
});

interface Props extends SliderProps {
  label: string;
}

const _Slider = ({ label, ...sliderProps }: Props) => {
  return (
    <Stack mr={1}>
      <Stack direction="row" justifyContent="space-between">
        <InputLabel
          label={label}
          notificationsCount={sliderProps.value?.toString()}
        />
      </Stack>
      <StyledSlider {...sliderProps} />
    </Stack>
  );
};

export default _Slider;
