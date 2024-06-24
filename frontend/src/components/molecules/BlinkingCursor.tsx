import { keyframes } from '@emotion/react';

import Box from '@mui/material/Box';

const blink = keyframes`
  from {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const CURSOR_PLACEHOLDER = '\u200B';

interface Props {
  whitespace?: boolean;
}

export default function BlinkingCursor({ whitespace }: Props) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        backgroundColor: 'text.primary',
        borderRadius: '50%',
        animation: `1s ease-in-out 0.1s ${blink} infinite`,
        ml: whitespace ? '0.5em' : 0
      }}
    />
  );
}
