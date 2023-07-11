import { primary } from 'palette';
import { grey } from 'palette';
import React from 'react';

import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, FormControl, FormHelperText, MenuItem } from '@mui/material';
import MSelect, { SelectChangeEvent } from '@mui/material/Select';

import useIsDarkMode from 'hooks/useIsDarkMode';

import NotificationCount from './NotificationCount';
import InputLabel from './inputLabel';

export type SelectItem = {
  label: string;
  notificationCount?: number;
  value: string;
};

type SelectProps = {
  children?: React.ReactElement;
  disabled?: boolean;
  id: string;
  items: SelectItem[];
  label?: string;
  onChange: (e: SelectChangeEvent) => void;
  size?: 'small' | 'medium';
  value?: string;
};

export default function Select({
  children,
  id,
  items,
  label,
  onChange,
  size = 'small',
  value,
  disabled = true
}: SelectProps): JSX.Element {
  const isDarkMode = useIsDarkMode();

  return (
    <Box width="100%">
      {label ? <InputLabel id={id} label={label} /> : null}
      <FormControl fullWidth>
        <MSelect
          labelId={id}
          value={value}
          onChange={onChange}
          size={size}
          disabled={disabled}
          renderValue={(value) =>
            `${items.find((item) => item.value === value)?.label}`
          }
          sx={{
            backgroundColor: isDarkMode ? grey[900] : '',
            color: isDarkMode ? grey[300] : grey[600],
            fontSize: '14px',
            fontWeight: 400,
            my: 0.5
          }}
          inputProps={{
            sx: {
              display: 'flex',
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
            items.map((item, index) => (
              <MenuItem
                value={item.value}
                key={`select-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 500,
                  fontSize: '14px',
                  color:
                    (isDarkMode && grey[400]) ||
                    (value === item.value ? primary[500] : grey[700]),
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
                  <NotificationCount
                    notificationsCount={item.notificationCount}
                  />
                ) : null}
              </MenuItem>
            ))}
        </MSelect>
        <FormHelperText sx={{ m: 0, fontWeight: 400, color: grey[500] }}>
          Disabled
        </FormHelperText>
      </FormControl>
    </Box>
  );
}
