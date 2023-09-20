import { IAvatarElement } from 'src/types';

import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

interface Props {
  element: IAvatarElement;
  author: string;
}

const AvatarElement = ({ element, author }: Props) => (
  <Tooltip title={author}>
    <span className={`message-avatar`}>
      <Avatar
        sx={{ width: 38, height: 38, mt: '-4px' }}
        src={element.url || URL.createObjectURL(new Blob([element.content!]))}
      />
    </span>
  </Tooltip>
);

export { AvatarElement };
