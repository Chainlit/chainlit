import { MessageContext } from 'contexts/MessageContext';
import { useContext, useRef, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import { Box, IconButton, Stack, TextField } from '@mui/material';

import {
  IStep,
  messagesState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import { AccentButton, RegularButton } from 'components/atoms/buttons';
import { Translator } from 'components/i18n';

import PencilIcon from 'assets/pencil';

interface Props {
  message: IStep;
}

export default function UserMessage({
  message,
  children
}: React.PropsWithChildren<Props>) {
  const config = useConfig();
  const { askUser, loading } = useContext(MessageContext);
  const { editMessage } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const disabled = loading || !!askUser;
  const [isEditing, setIsEditing] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const isEditable = !!config.config?.features.edit_message;

  const handleEdit = () => {
    if (textFieldRef.current) {
      const newOutput = textFieldRef.current.value;
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        if (index === -1) {
          return prev;
        }
        const slice = prev.slice(0, index + 1);
        slice[index].steps = [];
        return slice;
      });
      setIsEditing(false);
      editMessage({ ...message, output: newOutput });
    }
  };

  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        gap={1}
        width="100%"
        sx={{
          '&:hover .edit-icon': {
            visibility: 'visible'
          }
        }}
      >
        {!isEditing && isEditable && (
          <IconButton
            sx={{
              ml: 'auto',
              visibility: 'hidden'
            }}
            className="edit-icon"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            <PencilIcon sx={{ height: 16, width: 16 }} />
          </IconButton>
        )}
        <Box
          sx={{
            px: 2.5,
            position: 'relative',
            borderRadius: '1.5rem',
            backgroundColor: 'background.paper',
            width: isEditing ? '100%' : 'auto',
            maxWidth: isEditing ? '100%' : '70%',
            flexGrow: isEditing ? 1 : 0,
            ml: isEditable ? 'default' : 'auto'
          }}
        >
          {isEditing ? (
            <Stack py={1.5}>
              <TextField
                id="edit-chat-input"
                multiline
                autoFocus
                variant="standard"
                autoComplete="off"
                defaultValue={message.output}
                fullWidth
                inputRef={textFieldRef}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    pl: 0,
                    width: '100%'
                  }
                }}
              />
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <RegularButton onClick={() => setIsEditing(false)}>
                  <Translator path="components.molecules.newChatDialog.cancel" />
                </RegularButton>
                <AccentButton
                  className="confirm-edit"
                  disabled={disabled}
                  variant="outlined"
                  onClick={handleEdit}
                >
                  <Translator path="components.molecules.newChatDialog.confirm" />
                </AccentButton>
              </Box>
            </Stack>
          ) : (
            children
          )}
        </Box>
      </Box>
    </Box>
  );
}
