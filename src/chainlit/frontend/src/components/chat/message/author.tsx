import { Box, Tooltip, Typography } from '@mui/material';
import MessageTime from './time';
import { useColorForName } from 'helpers/color';
import { IMessage } from 'state/chat';
import { useRecoilValue } from 'recoil';
import { IAvatarElement, elementState } from 'state/element';
import AvatarElement from 'components/element/avatar';

interface Props {
  message: IMessage;
  show?: boolean;
}

export const authorBoxWidth = 70;

export default function Author({ message, show }: Props) {
  const getColorForName = useColorForName();
  const elements = useRecoilValue(elementState);
  const avatars = elements.filter((e) => e.type === 'avatar');
  const avatarEl = avatars.find((e) => e.name === message.author);

  const avatar = show && avatarEl && (
    <AvatarElement
      element={avatarEl as IAvatarElement}
      author={message.author}
    />
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
