import { grey } from 'palette';

import Slider, { SliderProps as MSliderProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

import { IInput } from 'types/Input';

import InputStateHandler from './inputs/inputStateHandler';

export type SliderProps = IInput & MSliderProps;

const _Slider = ({
  description,
  hasError,
  id,
  label,
  tooltip,
  ...sliderProps
}: SliderProps) => {
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
      notificationsCount={sliderProps.value?.toString()}
    >
      <StyledSlider {...sliderProps} id={id} name={id} />
    </InputStateHandler>
  );
};

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

export default _Slider;
