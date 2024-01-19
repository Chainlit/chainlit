import { useIsDarkMode } from 'hooks';
import React from 'react';
import { InputStateHandler } from 'src/inputs';
import { grey } from 'theme';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { IInput } from 'src/types/Input';

interface ToggleProps extends IInput {
  items: string[];
  onChange: (newValue: string) => void;
  value: string;
}

const Toggle = (props: ToggleProps): JSX.Element => {
  const { id, items, label, onChange, value, disabled } = props;

  const isDarkMode = useIsDarkMode();

  return (
    <InputStateHandler
      id={id}
      label={label}
      sx={{
        width: 'fit-content'
      }}
    >
      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.background.paper,
          borderRadius: 1
        }}
      >
        <Tabs
          value={items.findIndex((item) => item === value)}
          onChange={(event: React.SyntheticEvent, newValue: number) =>
            onChange(items[newValue])
          }
          sx={{
            minHeight: '39px !important',
            '& .MuiButtonBase-root': {
              textTransform: 'none',
              zIndex: 1,
              color: grey[isDarkMode ? 600 : 500],
              fontSize: '14px',
              fontWeight: 500,
              padding: 0,
              minHeight: '39px !important',
              width: '125px'
            },
            '& .Mui-selected': {
              color: 'white !important'
            },
            '& .MuiTabs-indicator': {
              background: (theme) =>
                isDarkMode ? theme.palette.divider : theme.palette.primary.main,
              height: '100%',
              borderRadius: '5px'
            }
          }}
        >
          {items.map((item) => (
            <Tab
              disabled={disabled}
              key={`tab-${item}`}
              className={`tab-${item}`}
              disableRipple
              label={item}
            />
          ))}
        </Tabs>
      </Box>
    </InputStateHandler>
  );
};

export { Toggle };
