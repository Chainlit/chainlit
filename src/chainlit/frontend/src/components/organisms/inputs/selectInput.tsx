import { primary } from 'palette';
import { grey } from 'palette';
import React from 'react';

import { KeyboardArrowDown } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import MSelect, { SelectChangeEvent } from '@mui/material/Select';

import NotificationCount from 'components/atoms/notificationCount';

import useIsDarkMode from 'hooks/useIsDarkMode';

import { IInput } from 'types/Input';

import InputStateHandler from './inputStateHandler';

export type SelectItem = {
  label: string;
  notificationCount?: number;
  value: string | number;
};

export type SelectInputProps = {
  children?: React.ReactNode;
  items?: SelectItem[];
  name?: string;
  onChange: (e: SelectChangeEvent) => void;
  renderLabel?: () => string;
  value?: string | number;
} & IInput;

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
      <NotificationCount notificationsCount={item.notificationCount} />
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
  renderLabel
}: SelectInputProps): JSX.Element {
  const isDarkMode = useIsDarkMode();

  return (
    <InputStateHandler
      id={id}
      hasError={hasError}
      description={description}
      label={label}
      tooltip={tooltip}
    >
      <MSelect
        labelId={id}
        value={value?.toString()}
        onChange={onChange}
        size={size}
        disabled={disabled}
        renderValue={() =>
          (renderLabel && renderLabel()) ||
          `${items?.find((item) => item.value === value)?.label}`
        }
        sx={{
          backgroundColor: isDarkMode ? grey[900] : '',
          my: 0.5,
          boxShadow:
            '0px 10px 10px 0px rgba(0, 0, 0, 0.05), 0px 2px 4px 0px rgba(0, 0, 0, 0.05)'
        }}
        inputProps={{
          id: id,
          name: name || id,
          sx: {
            px: '16px',
            py: size === 'small' ? '10px' : '14px'
          },
          MenuProps: {
            sx: {
              '&& .Mui-selected, .Mui-selected.Mui-selected:hover': {
                backgroundColor: isDarkMode ? grey[800] : primary[50]
              }
            },
            MenuListProps: {
              sx: { backgroundColor: isDarkMode ? grey[900] : '' }
            }
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
                : ''
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
