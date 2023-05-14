import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props {
  conversationId: string;
}

export default function OpenConversationButton({ conversationId }: Props) {
  return (
    <IconButton
      component={Link}
      to={`/conversations/${conversationId}`}
      size="small"
      color="primary"
    >
      <VisibilityIcon />
    </IconButton>
  );
}
