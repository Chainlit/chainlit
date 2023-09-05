import React from 'react';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { MenuItem, SxProps } from '@mui/material';
import MSelect, { SelectChangeEvent, SelectProps } from '@mui/material/Select';

import {
  IInput,
  InputStateHandler,
  NotificationCount
} from '@chainlit/components';
import { primary } from '@chainlit/components/theme';
import { grey } from '@chainlit/components/theme';

import useIsDarkMode from 'hooks/useIsDarkMode';

export type SelectItem = {
  label: string;
  notificationCount?: number;
  value: string | number;
};

export type SelectInputProps = IInput &
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

type MenuItemProps = {
  index: number;
  item: SelectItem;
  selected: boolean;
  isDarkMode: boolean;
};

export const renderMenuItem = ({
  item,
  selected,
  isDarkMode,
  index
}: MenuItemProps) => (
  <MenuItem
    value={item.value}
    key={`select-${index}`}
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 500,
      fontSize: '14px',
      color: (isDarkMode && grey[400]) || (selected ? primary[500] : grey[700]),
      '&:hover': {
        backgroundColor: isDarkMode ? grey[800] : primary[50],
        color: isDarkMode ? grey[400] : primary[500],
        '& .notification-count': {
          backgroundColor: isDarkMode ? grey[850] : primary[100],
          color: isDarkMode ? grey[400] : primary[500]
        }
      }
    }}
  >
    {item.label || item.value}
    {item.notificationCount ? (
      <NotificationCount count={item.notificationCount} />
    ) : null}
  </MenuItem>
);

export default function SelectInput({
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
}: SelectInputProps): JSX.Element {
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
          items?.map((item, index) =>
            renderMenuItem({
              item,
              index,
              selected: item.value === value,
              isDarkMode
            })
          )}
      </MSelect>
    </InputStateHandler>
  );
}
