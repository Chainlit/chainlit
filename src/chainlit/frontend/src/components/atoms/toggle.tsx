import { grey, primary } from 'palette';
import React from 'react';

import { Box } from '@mui/material';
import { Tab, Tabs } from '@mui/material';

import useIsDarkMode from 'hooks/useIsDarkMode';

interface ToggleProps {
  items: string[];
  value: string;
  onChange: (newValue: string) => void;
}

const Toggle = (props: ToggleProps): JSX.Element => {
  const { items, onChange, value } = props;

  const isDarkMode = useIsDarkMode();

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderRadius: 1,
        padding: 0.5,
        width: 'fit-content'
      }}
    >
      <Tabs
        value={items.findIndex((item) => item === value)}
        onChange={(event: React.SyntheticEvent, newValue: number) =>
          onChange(items[newValue])
        }
        sx={{
          minHeight: '40px !important',

          '& .MuiButtonBase-root': {
            textTransform: 'none',
            zIndex: 1,
            color: grey[isDarkMode ? 600 : 500],
            fontSize: '14px',
            fontWeight: 500,
            padding: 0,
            minHeight: '40px !important',
            width: '125px'
          },
          '& .Mui-selected': {
            color: 'white !important'
          },
          '& .MuiTabs-indicator': {
            background: (theme) =>
              isDarkMode ? theme.palette.divider : primary[600],
            height: '100%',
            borderRadius: '5px'
          }
        }}
      >
        {items.map((item) => (
          <Tab
            key={`tab-${item}`}
            className={`tab-${item}`}
            disableRipple
            label={item}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default Toggle;
