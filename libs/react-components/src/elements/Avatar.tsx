import Avatar from '@mui/material/Avatar';

import { type IAvatarElement } from 'client-types/';

interface Props {
  author: string;
  bgColor?: string;
  element?: IAvatarElement;
}

const AvatarElement = ({ element, author, bgColor }: Props) => (
  <span className={`message-avatar`}>
    <Avatar
      sx={{
        width: 26,
        height: 26,
        bgcolor: bgColor,
        fontSize: '0.75rem',
        mt: '-2px'
      }}
      src={element?.url}
    >
      {author[0]}
    </Avatar>
  </span>
);

export { AvatarElement };
