import Stack from '@mui/material/Stack';

import FeedbackSelect from './FeedbackSelect';
import SearchBar from './SearchBar';

export default function Filters() {
  return (
    <Stack
      sx={{
        flexDirection: 'row',
        gap: 1
      }}
    >
      <SearchBar />
      <FeedbackSelect />
    </Stack>
  );
}
