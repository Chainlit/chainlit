import { useState } from 'react';

import UserAvatar from './avatar';
import UserMenu from './menu';

export default function UserButton() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <UserAvatar
        fullWidth
        onClick={handleClick}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      />
      <UserMenu open={open} anchorEl={anchorEl} handleClose={handleClose} />
    </>
  );
}
