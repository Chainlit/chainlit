import { green } from 'palette';

import MSwitch, { SwitchProps as MSwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

import InputStateHandler from 'components/organisms/inputs/inputStateHandler';

import { IInput } from 'types/Input';

export type SwitchProps = {
  checked: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onChange: (
    event?: React.ChangeEvent<HTMLInputElement>,
    checked?: boolean
  ) => void;
} & IInput;

export default function Switch(props: SwitchProps): JSX.Element {
  const {
    checked,
    description,
    disabled,
    hasError,
    id,
    inputProps,
    label,
    onChange,
    tooltip
  } = props;

  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <StyledSwitch
        name={id}
        disabled={disabled}
        edge="end"
        onChange={onChange}
        checked={checked}
        inputProps={inputProps}
      />
    </InputStateHandler>
  );
}

const StyledSwitch = styled((props: MSwitchProps) => (
  <MSwitch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    width: 40,
    height: 24,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      margin: 0,
      padding: '4px',
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: green[500],
          opacity: 1,
          border: 0
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5
        }
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color: isDarkMode ? theme.palette.grey[600] : theme.palette.grey[100]
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: isDarkMode ? 0.3 : 0.7
      }
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 16,
      height: 16,
      boxShadow: 'unset'
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: theme.palette.grey[400],
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500
      })
    }
  };
});
