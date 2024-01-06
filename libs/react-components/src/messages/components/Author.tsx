import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { AvatarElement } from 'src/elements/Avatar';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useColorForName } from 'hooks/useColors';

import type { IStep } from 'client-types/';

import { MessageTime } from './MessageTime';

interface Props {
  message: IStep;
  show?: boolean;
  children?: React.ReactNode;
}

export const AUTHOR_BOX_WIDTH = 26;

const Author = ({ message, show, children }: Props) => {
  const context = useContext(MessageContext);
  const getColorForName = useColorForName(context.uiName);

  const isUser = message.type === 'user_message';
  const author = isUser ? 'You' : message.name;

  const avatarEl = context.avatars.find((e) => e.name === author);
  const avatar = show ? (
    <Stack alignItems="center" gap={1}>
      <AvatarElement
        element={avatarEl}
        author={author}
        bgColor={getColorForName(author, isUser, message.isError)}
      />
      {(!!message.indent || message.parentId) && (
        <Box
          width="2px"
          height="100%"
          borderRadius="13px"
          bgcolor={getColorForName(author, isUser)}
        />
      )}
    </Stack>
  ) : (
    <Box width={AUTHOR_BOX_WIDTH} />
  );
  const name = (
    <Stack direction="row" gap={1} alignItems="center">
      {show ? (
        <Typography
          noWrap
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 'unset'
          }}
        >
          {author}
        </Typography>
      ) : null}
      <MessageTime timestamp={message.createdAt} />
    </Stack>
  );

  return (
    <Stack direction="row" gap={1.5} width="100%">
      {avatar}
      <Stack gap={1} width={`calc(100% - ${AUTHOR_BOX_WIDTH + 12}px)`}>
        {name}
        {children}
      </Stack>
    </Stack>
  );
};

export { Author };
