import { Box, Tooltip, Typography } from '@mui/material';
import MessageTime from './time';
import { useColorForName } from 'helpers/color';
import { IMessage } from 'state/chat';

interface Props {
  message: IMessage;
  show?: boolean;
}

export const authorBoxWidth = 70;

export default function Author({ message, show }: Props) {
  const getColorForName = useColorForName();

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

  return (
    <>
      <Box width={authorBoxWidth} pr={2}>
        {name}
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
