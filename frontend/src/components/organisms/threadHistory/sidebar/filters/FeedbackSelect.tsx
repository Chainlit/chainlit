import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';

import FilterList from '@mui/icons-material/FilterList';
import ThumbDown from '@mui/icons-material/ThumbDown';
import ThumbUp from '@mui/icons-material/ThumbUp';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';

import { grey } from '@chainlit/react-components';

import { threadsFiltersState } from 'state/threads';

export enum FEEDBACKS {
  ALL = 0,
  POSITIVE = 1,
  NEGATIVE = -1
}

export default function FeedbackSelect() {
  const [filters, setFilters] = useRecoilState(threadsFiltersState);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const handleChange = (feedback: number) => {
    setFilters((prev) => ({ ...prev, feedback }));
    setAnchorEl(null);
  };

  const renderMenuItem = (label: string, feedback: number) => {
    return (
      <Box
        onClick={() => handleChange(feedback)}
        sx={{
          cursor: 'pointer',
          px: 1.5,
          py: 1,
          borderRadius: 1,
          '&:hover': {
            background: (theme) => theme.palette.background.default
          }
        }}
      >
        {label}
      </Box>
    );
  };

  const renderIcon = () => {
    const sx = { width: 16, height: 16 };

    switch (filters.feedback) {
      case FEEDBACKS.POSITIVE:
        return <ThumbUp sx={sx} />;
      case FEEDBACKS.NEGATIVE:
        return <ThumbDown sx={sx} />;
      default:
        return <FilterList sx={sx} />;
    }
  };

  return (
    <>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          borderRadius: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? grey[850] : 'grey.100'
        }}
      >
        {renderIcon()}
      </IconButton>
      <Menu
        id="feedback-filter-select"
        autoFocus
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        sx={{ mt: 1 }}
        MenuListProps={{
          sx: { p: 0.5 }
        }}
        slotProps={{
          paper: {
            sx: {
              background: (theme) => theme.palette.background.paper,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0px 2px 4px 0px #0000000D'
                  : '0px 10px 10px 0px #0000000D'
            }
          }
        }}
      >
        <Stack>
          {renderMenuItem(
            t(
              'components.organisms.threadHistory.sidebar.filters.FeedbackSelect.feedbackAll'
            ),
            FEEDBACKS.ALL
          )}
          {renderMenuItem(
            t(
              'components.organisms.threadHistory.sidebar.filters.FeedbackSelect.feedbackPositive'
            ),
            FEEDBACKS.POSITIVE
          )}
          {renderMenuItem(
            t(
              'components.organisms.threadHistory.sidebar.filters.FeedbackSelect.feedbackNegative'
            ),
            FEEDBACKS.NEGATIVE
          )}
        </Stack>
      </Menu>
    </>
  );
}
