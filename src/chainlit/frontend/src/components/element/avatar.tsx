import { Avatar, Tooltip } from '@mui/material';

import { IAvatarElement } from 'state/element';

interface Props {
  element: IAvatarElement;
  author: string;
}

export default function AvatarElement({ element, author }: Props) {
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  const className = `message-avatar`;
  return (
    <Tooltip title={author}>
      <span className={className}>
        <Avatar sx={{ width: 38, height: 38, mt: '-4px' }} src={src} />
      </span>
    </Tooltip>
  );
}
