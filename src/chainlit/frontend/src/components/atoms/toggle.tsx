import { grey } from 'palette';
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
          '& .MuiButtonBase-root': {
            textTransform: 'none',
            zIndex: 1,
            color: grey[600],
            fontSize: '14px',
            fontWeight: 600,
            padding: 0
          },
          '& .Mui-selected': {
            color: (theme) =>
              `${isDarkMode ? 'white' : theme.palette.primary.main} !important`
          },
          '& .MuiTabs-indicator': {
            background: (theme) =>
              isDarkMode ? theme.palette.divider : theme.palette.primary.light,
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
