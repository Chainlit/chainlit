import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props {
  conversationId: number;
}

export default function OpenConversationButton({ conversationId }: Props) {
  return (
    <IconButton
      className="open-conversation-button"
      component={Link}
      to={`/conversations/${conversationId}`}
      size="small"
      color="primary"
    >
      <VisibilityIcon />
    </IconButton>
  );
}
