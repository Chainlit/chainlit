import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import SendIcon from '@mui/icons-material/Telegram';
import TuneIcon from '@mui/icons-material/Tune';
import { IconButton, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import {
  askUserState,
  chatSettingsState,
  loadingState,
  sessionState
} from 'state/chat';
import { chatHistoryState } from 'state/chatHistory';

import HistoryButton from '../history';

interface Props {
  onSubmit: (message: string) => void;
  onReply: (message: string) => void;
}

function getLineCount(el: HTMLDivElement) {
  const textarea = el.querySelector('textarea');
  if (!textarea) {
    return 0;
  }
  const lines = textarea.value.split('\n');
  return lines.length;
}

const Input = ({ onSubmit, onReply }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [chatSettings, setChatSettings] = useRecoilState(chatSettingsState);
  const loading = useRecoilValue(loadingState);
  const askUser = useRecoilValue(askUserState);
  const session = useRecoilValue(sessionState);
  const setChatHistory = useSetRecoilState(chatHistoryState);
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const socketOk = session?.socket && !session?.error;
  const disabled = !socketOk || loading || askUser?.spec.type === 'file';

  useEffect(() => {
    if (ref.current && !loading && !disabled) {
      ref.current.focus();
    }
  }, [loading, disabled]);

  const submit = useCallback(() => {
    if (value === '' || disabled) {
      return;
    }
    if (askUser) {
      onReply(value);
    } else {
      onSubmit(value);
    }
    setValue('');
  }, [value, disabled, setValue, askUser, onSubmit]);

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!isComposing) {
          e.preventDefault();
          submit();
        }
      } else if (e.key === 'ArrowUp') {
        const lineCount = getLineCount(e.currentTarget as HTMLDivElement);
        if (lineCount <= 1) {
          setChatHistory((old) => ({ ...old, open: true }));
        }
      }
    },
    [submit, setChatHistory, isComposing]
  );

  const onHistoryClick = useCallback((content: string) => {
    if (ref.current) {
      setValue(content);
    }
  }, []);

  const startAdornment = (
    <>
      {chatSettings.inputs.length > 0 && (
        <IconButton
          disabled={disabled}
          color="inherit"
          onClick={() => setChatSettings((old) => ({ ...old, open: true }))}
        >
          <TuneIcon />
        </IconButton>
      )}
      <HistoryButton onClick={onHistoryClick} />
    </>
  );

  const endAdornment = (
    <IconButton disabled={disabled} color="inherit" onClick={() => submit()}>
      <SendIcon />
    </IconButton>
  );

  return (
    <TextField
      inputRef={ref}
      id="chat-input"
      autoFocus
      multiline
      variant="standard"
      autoComplete="false"
      placeholder="Type your message here..."
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      value={value}
      fullWidth
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <InputAdornment
            sx={{ ml: 1, color: 'text.secondary' }}
            position="start"
          >
            {startAdornment}
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{ mr: 1, color: 'text.secondary' }}
          >
            {endAdornment}
          </InputAdornment>
        )
      }}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: 'box-shadow: 0px 2px 4px 0px #0000000D',

        textarea: {
          height: '34px',
          maxHeight: '30vh',
          overflowY: 'auto !important',
          resize: 'none',
          paddingBottom: '0.75rem',
          paddingTop: '0.75rem',
          color: 'text.primary',
          lineHeight: '24px'
        }
      }}
    />
  );
};

export default Input;
