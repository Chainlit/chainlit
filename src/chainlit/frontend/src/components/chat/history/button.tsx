import HistoryIcon from '@mui/icons-material/History';
import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { useRecoilState } from 'recoil';
import { IChat, historyOpenedState } from 'state/chat';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onClick: (content: string) => void;
  onOpen: () => void;
  chats?: IChat[];
}

export default function HistoryButton({ onClick, onOpen, chats }: Props) {
  const [open, setOpen] = useRecoilState(historyOpenedState);
  const ref = useRef<any>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (open) {
      if (ref.current) {
        setAnchorEl(ref.current);
        onOpen();
      }
    }
  }, [open]);

  const history: Record<
    string,
    {
      key: number;
      hour: string;
      content: string;
    }[]
  > = {};

  chats?.forEach((c) => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const date = new Date(c.createdAt).toLocaleDateString(
      undefined,
      dateOptions
    );
    if (!history[date]) {
      history[date] = [];
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric'
    };
    history[date].push({
      key: c.createdAt,
      hour: new Date(c.createdAt).toLocaleTimeString(undefined, timeOptions),
      content: c.messages[0].content
    });
  });

  const menuEls: JSX.Element[] = [];

  Object.keys(history).forEach((date) => {
    menuEls.push(
      <div key={date} data-disabled>
        <Typography
          color="text.primary"
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '16px 12px',
            textTransform: 'uppercase'
          }}
        >
          {date}
        </Typography>
      </div>
    );

    history[date].forEach((h) => {
      menuEls.push(
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(false);
            onClick(h.content);
          }}
          disableRipple
          key={h.key}
          sx={{ p: 2, alignItems: 'baseline' }}
        >
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 700,
              flexBasis: '64px'
            }}
            color="text.secondary"
          >
            {h.hour}
          </Typography>
          <Typography
            color="text.primary"
            sx={{
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              maxHeight: '50px',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
              flexBasis: 'calc(100% - 60px)',
              flexGrow: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '24px'
            }}
          >
            {h.content}
          </Typography>
        </MenuItem>
      );
    });
  });

  if (menuEls.length === 0) {
    menuEls.push(
      <div data-disabled>
        <Typography
          color="text.secondary"
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '16px 12px',
            textTransform: 'uppercase'
          }}
        >
          Such empty...
        </Typography>
      </div>
    );
  }

  const menu = (
    <Menu
      autoFocus
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        elevation: 0,
        sx: {
          mt: -2,
          overflow: 'visible',
          maxHeight: '60vh',
          width: '250px',
          overflowY: 'scroll'
        }
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {menuEls}
    </Menu>
  );

  return (
    <div>
      {menu}
      <Tooltip title="Show history">
        <IconButton color="inherit" onClick={() => setOpen(!open)} ref={ref}>
          <HistoryIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
