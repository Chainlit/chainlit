import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import FeedbackSelect from './FeedbackSelect';
import SearchBar from './SearchBar';

export default function Filters() {
  return (
    <Box sx={{ px: 1.5 }}>
      <Stack
        sx={{
          flexDirection: 'row',
          gap: 1
        }}
      >
        <SearchBar />
        <FeedbackSelect />
      </Stack>
    </Box>
  );
}
