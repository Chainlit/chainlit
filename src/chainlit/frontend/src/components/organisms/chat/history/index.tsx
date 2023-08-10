/* eslint-disable @typescript-eslint/ban-ts-comment*/
import { grey } from 'palette';
import { useRef, useState } from 'react';
import { useRecoilState } from 'recoil';

import { AutoDelete } from '@mui/icons-material';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import {
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import { MessageHistory, chatHistoryState } from 'state/chatHistory';

interface Props {
  onClick: (content: string) => void;
}

function buildHistory(historyMessages: MessageHistory[]) {
  const history: Record<
    string,
    {
      key: number | string;
      hour: string;
      content: string;
    }[]
  > = {};

  historyMessages?.forEach((hm) => {
    const { createdAt, content } = hm;
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    };
    const date = new Date(createdAt).toLocaleDateString(undefined, dateOptions);
    if (!history[date]) {
      history[date] = [];
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric'
    };
    history[date].push({
      key: createdAt,
      hour: new Date(createdAt).toLocaleTimeString(undefined, timeOptions),
      content: content
    });
  });

  return history;
}

export default function HistoryButton({ onClick }: Props) {
  const [chatHistory, setChatHistory] = useRecoilState(chatHistoryState);

  const ref = useRef<any>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (chatHistory.open && !anchorEl) {
    if (ref.current) {
      setAnchorEl(ref.current);
    }
  }

  const toggleChatHistoryMenu = (open: boolean) =>
    setChatHistory((old) => ({ ...old, open }));

  const header = (
    // @ts-ignore
    <Stack
      disabled
      key="title"
      direction="row"
      p={1}
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography
        color="text.primary"
        sx={{ fontSize: '14px', fontWeight: 700 }}
      >
        Last messages
      </Typography>
      <IconButton
        onClick={() => setChatHistory((old) => ({ ...old, messages: [] }))}
      >
        <AutoDelete />
      </IconButton>
    </Stack>
  );

  const empty =
    chatHistory?.messages.length === 0 ? (
      // @ts-ignore
      <div key="empty" id="history-empty" disabled>
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
    ) : null;

  const loading = !chatHistory.messages ? (
    // @ts-ignore
    <div key="loading" id="history-loading" disabled>
      <Typography
        color="text.secondary"
        sx={{
          fontSize: '12px',
          fontWeight: 700,
          padding: '16px 12px',
          textTransform: 'uppercase'
        }}
      >
        Loading...
      </Typography>
    </div>
  ) : null;

  const menuEls: (JSX.Element | null)[] = [header, empty, loading];

  if (chatHistory.messages) {
    const history = buildHistory(chatHistory.messages);
    Object.keys(history).forEach((date) => {
      menuEls.push(
        // @ts-ignore
        <div key={date} disabled>
          <Typography
            color="text.primary"
            sx={{
              p: 1,
              fontSize: '10px',
              fontWeight: 700,
              color: grey[500]
            }}
          >
            {date}
          </Typography>
        </div>
      );
      let prev = '';
      history[date].forEach((h) => {
        if (prev === h.content) {
          return;
        }
        prev = h.content;
        menuEls.push(
          <MenuItem
            className="history-item"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleChatHistoryMenu(false);
              onClick(h.content);
            }}
            disableRipple
            key={h.key}
            sx={{
              p: 1,
              alignItems: 'baseline',
              borderRadius: '4px'
            }}
          >
            <Typography
              color="text.primary"
              sx={{
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                maxHeight: '50px',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
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
  }

  const menu = anchorEl ? (
    <Menu
      autoFocus
      anchorEl={anchorEl}
      open={chatHistory.open}
      onClose={() => toggleChatHistoryMenu(false)}
      PaperProps={{
        sx: {
          p: 1,
          backgroundImage: 'none',
          mt: -2,
          ml: -1,
          overflow: 'visible',
          maxHeight: '314px',
          width: '334px',
          overflowY: 'auto',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0px 2px 4px 0px #0000000D'
              : '0px 10px 10px 0px #0000000D'
        }
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      {menuEls}
    </Menu>
  ) : null;

  return (
    <div>
      {menu}
      <Tooltip title="Show history">
        <IconButton
          color="inherit"
          onClick={() => toggleChatHistoryMenu(!chatHistory.open)}
          ref={ref}
        >
          <KeyboardDoubleArrowUpIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
