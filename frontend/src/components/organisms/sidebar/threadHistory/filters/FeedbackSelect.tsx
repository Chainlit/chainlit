import { useState } from 'react';
import { useRecoilState } from 'recoil';

import FilterList from '@mui/icons-material/FilterList';
import ThumbDown from '@mui/icons-material/ThumbDown';
import ThumbUp from '@mui/icons-material/ThumbUp';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';

import { useTranslation } from 'components/i18n/Translator';

import { threadsFiltersState } from 'state/threads';

export enum Feedback {
  POSITIVE = 1,
  NEGATIVE = 0
}

export default function FeedbackSelect() {
  const [filters, setFilters] = useRecoilState(threadsFiltersState);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { t } = useTranslation();

  const handleChange = (feedback?: number) => {
    setFilters((prev) => ({ ...prev, feedback }));
    setAnchorEl(null);
  };

  const renderMenuItem = (label: string, feedback?: number) => {
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
    const sx = { width: 20, height: 20, color: 'text.secondary' };

    switch (filters.feedback) {
      case Feedback.POSITIVE:
        return <ThumbUp sx={sx} />;
      case Feedback.NEGATIVE:
        return <ThumbDown sx={sx} />;
      default:
        return <FilterList sx={sx} />;
    }
  };

  return (
    <>
      <IconButton
        disableRipple
        onClick={(event) => setAnchorEl(event.currentTarget)}
        edge="end"
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
            undefined
          )}
          {renderMenuItem(
            t(
              'components.organisms.threadHistory.sidebar.filters.FeedbackSelect.feedbackPositive'
            ),
            Feedback.POSITIVE
          )}
          {renderMenuItem(
            t(
              'components.organisms.threadHistory.sidebar.filters.FeedbackSelect.feedbackNegative'
            ),
            Feedback.NEGATIVE
          )}
        </Stack>
      </Menu>
    </>
  );
}
