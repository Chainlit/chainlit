import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState } from 'recoil';
import 'regenerator-runtime';

import TuneIcon from '@mui/icons-material/Tune';
import { Box, IconButton, Stack, TextField } from '@mui/material';

import { Attachments } from '@chainlit/app/src/components/molecules/attachments';
import { SubmitButton } from '@chainlit/app/src/components/organisms/chat/inputBox/SubmitButton';
import UploadButton from '@chainlit/app/src/components/organisms/chat/inputBox/UploadButton';
import SpeechButton from '@chainlit/app/src/components/organisms/chat/inputBox/speechButton';
import WaterMark from '@chainlit/app/src/components/organisms/chat/inputBox/waterMark';
import { IAttachment, attachmentsState } from '@chainlit/app/src/state/chat';
import {
  chatSettingsOpenState,
  projectSettingsState
} from '@chainlit/app/src/state/project';
import { inputHistoryState } from '@chainlit/app/src/state/userInputHistory';
import { FileSpec, useChatData } from '@chainlit/react-client';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  onSubmit: (message: string, attachments?: IAttachment[]) => void;
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

const Input = memo(
  ({ fileSpec, onFileUpload, onFileUploadError, onSubmit, onReply }: Props) => {
    const [attachments, setAttachments] = useRecoilState(attachmentsState);
    const [pSettings] = useRecoilState(projectSettingsState);
    const setInputHistory = useSetRecoilState(inputHistoryState);
    const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);

    const ref = useRef<HTMLDivElement>(null);
    const {
      loading,
      askUser,
      chatSettingsInputs,
      disabled: _disabled
    } = useChatData();

    const [value, setValue] = useState('');
    const [isComposing, setIsComposing] = useState(false);

    const showTextToSpeech = pSettings?.features.speech_to_text?.enabled;
    const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

    const { t } = useTranslation();

    useEffect(() => {
      const pasteEvent = (event: ClipboardEvent) => {
        if (event.clipboardData && event.clipboardData.items) {
          const items = Array.from(event.clipboardData.items);
          items.forEach((item) => {
            if (item.kind === 'file') {
              const file = item.getAsFile();
              if (file) {
                onFileUpload([file]);
              }
            }
          });
        }
      };

      if (!ref.current) {
        return;
      }

      const input = ref.current;
      input.addEventListener('paste', pasteEvent);

      return () => {
        input.removeEventListener('paste', pasteEvent);
      };
    }, []);

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
        onSubmit(value, attachments);
      }

      setAttachments([]);
      setValue('');
    }, [
      value,
      disabled,
      setValue,
      askUser,
      attachments,
      setAttachments,
      onSubmit
    ]);

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
            setInputHistory((old) => ({ ...old, open: true }));
          }
        }
      },
      [submit, setInputHistory, isComposing]
    );

    return (
      <>
        <Stack
          sx={{
            backgroundColor: 'background.default',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            margin: 1,
            paddingTop: 1,
            paddingX: 1,
            boxShadow: 'box-shadow: 0px 2px 4px 0px #0000000D',
            gap: 1,
            textarea: {
              height: '34px',
              maxHeight: '30vh',
              overflowY: 'auto !important',
              resize: 'none',
              color: 'text.primary',
              lineHeight: '24px'
            }
          }}
        >
          {attachments.length > 0 ? (
            <Box mt={2}>
              <Attachments />
            </Box>
          ) : null}
          <TextField
            inputRef={ref}
            id="copilot-chat-input"
            autoFocus
            multiline
            variant="standard"
            autoComplete="false"
            placeholder={t(
              'components.organisms.chat.inputBox.input.placeholder'
            )}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            value={value}
            fullWidth
            InputProps={{
              disableUnderline: true,
              sx: {
                pl: 0,
                width: '100%'
              },
              endAdornment: (
                <Box sx={{ mr: -2 }}>
                  <SubmitButton
                    onSubmit={submit}
                    disabled={disabled || (!loading && !value)}
                  />
                </Box>
              )
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            color="text.secondary"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" marginLeft={-1}>
              <UploadButton
                disabled={disabled}
                fileSpec={fileSpec}
                onFileUploadError={onFileUploadError}
                onFileUpload={onFileUpload}
              />
              {chatSettingsInputs.length > 0 && (
                <IconButton
                  id="chat-settings-open-modal"
                  disabled={disabled}
                  color="inherit"
                  onClick={() => setChatSettingsOpen(true)}
                  size="small"
                >
                  <TuneIcon fontSize="small" />
                </IconButton>
              )}
              {showTextToSpeech ? (
                <SpeechButton
                  onSpeech={(transcript) =>
                    setValue((text) => text + transcript)
                  }
                  language={pSettings.features?.speech_to_text?.language}
                  disabled={disabled}
                />
              ) : null}
            </Stack>

            <Box>
              <WaterMark />
            </Box>
          </Stack>
        </Stack>
      </>
    );
  }
);

export default Input;
