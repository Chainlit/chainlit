import { Box } from '@mui/material';

import Filters from './filters';
import ConversationTable from './table';

export default function Conversation() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      maxWidth="60rem"
      mx="auto"
      flexGrow={1}
    >
      <Box my={2} />
      <Filters />
      <Box my={2} />
      <ConversationTable />
    </Box>
  );
}
