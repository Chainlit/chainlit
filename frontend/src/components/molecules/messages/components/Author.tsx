import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { AvatarElement } from 'components/atoms/elements/Avatar';

import { useColorForName } from 'hooks/useColors';

import type { IStep } from 'client-types/';

interface Props {
  author: string;
  avatarUrl?: string;
  hide?: boolean;
}

export const AUTHOR_BOX_WIDTH = 26;

const Author = ({ author, avatarUrl, hide }: Props) => {
  const context = useContext(MessageContext);
  const getColorForName = useColorForName(context.uiName);

  return !hide ? (
    <Stack alignItems="center" gap={1}>
      <AvatarElement
        author={author}
        // avatarUrl={avatarUrl}
        bgColor={getColorForName(author, false, false)}
        classes='agent-avatar'
      />
    </Stack>
  ) : (
    <Box width={AUTHOR_BOX_WIDTH} />
  );
};

export { Author };
