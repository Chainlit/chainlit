import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

import { type IAvatarElement } from 'client-types/';

interface Props {
  element: IAvatarElement;
  author: string;
}

const AvatarElement = ({ element, author }: Props) => {
  if (!element.url) {
    return null;
  }

  return (
    <Tooltip title={author}>
      <span className={`message-avatar`}>
        <Avatar sx={{ width: 38, height: 38, mt: '-4px' }} src={element.url} />
      </span>
    </Tooltip>
  );
};

export { AvatarElement };
