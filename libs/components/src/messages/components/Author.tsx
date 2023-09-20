import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { AvatarElement } from 'src/elements/Avatar';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useColorForName } from 'hooks/useColors';

import { IMessage } from 'src/types/message';

import { MessageTime } from './MessageTime';

interface Props {
  message: IMessage;
  show?: boolean;
}

export const AUTHOR_BOX_WIDTH = 70;

const Author = ({ message, show }: Props) => {
  const context = useContext(MessageContext);
  const getColorForName = useColorForName(context.uiName);
  const avatarEl = context.avatars.find((e) => e.name === message.author);

  const avatar = show && avatarEl && (
    <AvatarElement element={avatarEl} author={message.author} />
  );

  const name = show && (
    <Tooltip title={message.author}>
      <Typography
        noWrap
        lineHeight="24px"
        sx={{
          mb: '-5px',
          width: AUTHOR_BOX_WIDTH,
          fontSize: '12px',
          fontWeight: 500,
          color: getColorForName(
            message.author,
            message.authorIsUser,
            message.isError
          )
        }}
      >
        {message.author}
      </Typography>
    </Tooltip>
  );

  const display = avatar || name;

  return (
    <>
      <Box width={AUTHOR_BOX_WIDTH} pr={2}>
        {display}
        <MessageTime timestamp={message.createdAt} />
      </Box>
      {(!!message.indent || message.parentId) && (
        <Box
          width="2px"
          borderRadius="13px"
          bgcolor={getColorForName(message.author, message.authorIsUser)}
          mr={2}
        />
      )}
    </>
  );
};

export { Author };
