import { Stack } from '@mui/material';

import AuthorSelect from './AuthorSelect';
import FeedbackSelect from './FeedbackSelect';
import SearchBar from './SearchBar';

export default function Filters() {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <SearchBar />
      <Stack direction="row" alignItems="center" spacing={2}>
        <FeedbackSelect />
        <AuthorSelect />
      </Stack>
    </Stack>
  );
}
