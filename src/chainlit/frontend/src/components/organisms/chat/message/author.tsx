import { useColorForName } from 'helpers/color';
import { useRecoilValue } from 'recoil';

import { Box, Tooltip, Typography } from '@mui/material';

import AvatarElement from 'components/atoms/element/avatar';

import { IMessage } from 'state/chat';
import { avatarState } from 'state/element';

import MessageTime from './time';

interface Props {
  message: IMessage;
  show?: boolean;
}

export const authorBoxWidth = 70;

export default function Author({ message, show }: Props) {
  const getColorForName = useColorForName();
  const avatars = useRecoilValue(avatarState);
  const avatarEl = avatars.find((e) => e.name === message.author);

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
          width: authorBoxWidth,
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
      <Box width={authorBoxWidth} pr={2}>
        {display}
        <MessageTime timestamp={message.createdAt} />
      </Box>
      {!!message.indent && (
        <Box
          width="2px"
          borderRadius="13px"
          bgcolor={getColorForName(message.author, message.authorIsUser)}
          mr={2}
        />
      )}
    </>
  );
}
