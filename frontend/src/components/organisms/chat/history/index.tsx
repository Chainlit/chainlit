/* eslint-disable @typescript-eslint/ban-ts-comment*/
import cloneDeep from 'lodash/cloneDeep';
import { useRef, useState } from 'react';
import { useRecoilState } from 'recoil';

import AutoDelete from '@mui/icons-material/AutoDelete';
import {
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import { UserInput } from '@chainlit/react-client';
import { grey } from '@chainlit/react-components/theme';

import { Translator } from 'components/i18n';

import ChevronUpIcon from 'assets/chevronUp';

import { inputHistoryState } from 'state/userInputHistory';

interface Props {
  disabled?: boolean;
  onClick: (content: string) => void;
}

function buildInputHistory(userInputs: UserInput[]) {
  const inputHistory: Record<
    string,
    {
      key: number | string;
      hour: string;
      content: string;
    }[]
  > = {};

  const reversedHistory = cloneDeep(userInputs).reverse();

  reversedHistory?.forEach((userInput) => {
    const { createdAt, content } = userInput;
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    };
    const date = new Date(createdAt).toLocaleDateString(undefined, dateOptions);
    if (!inputHistory[date]) {
      inputHistory[date] = [];
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric'
    };
    inputHistory[date].push({
      key: createdAt,
      hour: new Date(createdAt).toLocaleTimeString(undefined, timeOptions),
      content: content
    });
  });

  return inputHistory;
}

export default function InputHistoryButton({ disabled, onClick }: Props) {
  const [inputHistory, setInputHistory] = useRecoilState(inputHistoryState);

  const ref = useRef<any>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (inputHistory.open && !anchorEl) {
    if (ref.current) {
      setAnchorEl(ref.current);
    }
  }

  const toggleChatHistoryMenu = (open: boolean) =>
    setInputHistory((old) => ({ ...old, open }));

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
        <Translator path="components.organisms.chat.history.index.lastInputs" />
      </Typography>
      <IconButton
        onClick={() => setInputHistory((old) => ({ ...old, inputs: [] }))}
      >
        <AutoDelete />
      </IconButton>
    </Stack>
  );

  const empty =
    inputHistory?.inputs.length === 0 ? (
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
          <Translator path="components.organisms.chat.history.index.noInputs" />
        </Typography>
      </div>
    ) : null;

  const loading = !inputHistory.inputs ? (
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
        <Translator path="components.organisms.chat.history.index.loading" />
      </Typography>
    </div>
  ) : null;

  const menuEls: (JSX.Element | null)[] = [header, empty, loading];

  if (inputHistory.inputs) {
    const history = buildInputHistory(inputHistory.inputs);
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
      open={inputHistory.open}
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
        {
          // In MUI, a warning is triggered if we pass a disabled button. To avoid this warning, we should wrap the button in a <span></span> element when it can be disabled.
        }
        <span>
          <IconButton
            color="inherit"
            disabled={disabled}
            onClick={() => toggleChatHistoryMenu(!inputHistory.open)}
            ref={ref}
          >
            <ChevronUpIcon />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
}
