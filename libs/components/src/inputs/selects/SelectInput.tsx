import { InputStateHandler } from 'src/inputs/InputStateHandler';
import { grey, primary } from 'theme/index';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import type { SxProps } from '@mui/material';
import MSelect, { SelectChangeEvent, SelectProps } from '@mui/material/Select';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import { IInput } from 'src/types/Input';

import { MenuItem } from './MenuItem';

type SelectItem = {
  label: string;
  notificationCount?: number;
  value: string | number;
};

type SelectInputProps = IInput &
  Omit<SelectProps<string>, 'value' | 'onChange'> & {
    children?: React.ReactNode;
    items?: SelectItem[];
    name?: string;
    onChange: (e: SelectChangeEvent) => void;
    placeholder?: string;
    renderLabel?: () => string;
    value?: string | number;
    iconSx?: SxProps;
  };

const SelectInput = ({
  children,
  description,
  disabled = false,
  hasError,
  id,
  items,
  label,
  name,
  onChange,
  size = 'small',
  tooltip,
  value,
  placeholder = 'Select',
  renderLabel,
  onClose,
  sx,
  iconSx,
  ...rest
}: SelectInputProps): JSX.Element => {
  const isDarkMode = useIsDarkMode();

  return (
    <InputStateHandler
      id={id}
      hasError={hasError}
      description={description}
      label={label}
      tooltip={tooltip}
      sx={sx}
    >
      <MSelect
        {...rest}
        onClose={onClose}
        labelId={id}
        value={value?.toString()}
        onChange={onChange}
        size={size}
        disabled={disabled}
        displayEmpty
        renderValue={() => {
          if (!value || value === '') return placeholder;

          return (
            (renderLabel && renderLabel()) ||
            `${items?.find((item) => item.value === value)?.label}`
          );
        }}
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          borderRadius: 1,
          padding: 0.5,
          '&.MuiOutlinedInput-root': {
            '& fieldset': {
              border: (theme) => `1px solid ${theme.palette.divider}`
            }
          }
        }}
        inputProps={{
          id: id,
          name: name || id,
          sx: {
            color: grey[600],
            fontSize: '14px',
            fontWeight: 400,
            px: '16px',
            py: size === 'small' ? '10px' : '14px',
            h: '48px'
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              border: (theme: any) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme: any) =>
                theme.palette.mode === 'light'
                  ? '0px 2px 4px 0px #0000000D'
                  : '0px 10px 10px 0px #0000000D',
              '&& .Mui-selected, .Mui-selected.Mui-selected:hover': {
                backgroundColor: isDarkMode ? grey[800] : primary[50]
              }
            }
          },
          MenuListProps: {
            sx: { backgroundColor: isDarkMode ? grey[900] : '' }
          }
        }}
        IconComponent={(props) => (
          <KeyboardArrowDown
            {...props}
            fontSize="16px"
            sx={{
              px: '9px',
              color: !disabled
                ? `${isDarkMode ? grey[300] : grey[600]} !important`
                : '',
              ...iconSx
            }}
          />
        )}
      >
        {children ||
          items?.map((item) => (
            <MenuItem
              isDarkMode={isDarkMode}
              item={item}
              selected={item.value === value}
              value={item.value}
              key={item.value}
            />
          ))}
      </MSelect>
    </InputStateHandler>
  );
};

export { SelectInput };
export type { SelectItem, SelectInputProps };
