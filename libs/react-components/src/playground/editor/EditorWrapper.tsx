import merge from 'lodash/merge';
import { ClipboardCopy } from 'src/ClipboardCopy';
import { grey } from 'theme';

import Box, { BoxProps } from '@mui/material/Box';
import Stack, { StackProps } from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface Props {
  className?: string;
  clipboardValue?: string;
  sx?: StackProps['sx'];
  sxChildren?: BoxProps['sx'];
  title?: string;
}

export default function EditorWrapper({
  children,
  className,
  clipboardValue,
  sx,
  sxChildren,
  title
}: React.PropsWithChildren<Props>) {
  const theme = useTheme();

  return (
    <Stack
      spacing={title ? 1.5 : 0}
      sx={merge({ width: '100%', flex: 1, overflowY: 'auto' }, sx)}
    >
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {title}
      </Typography>
      <Box
        className={className}
        sx={merge(
          {
            position: 'relative',
            fontFamily: (theme) => theme.typography.fontFamily,
            fontSize: '16px',
            lineHeight: '24px',
            padding: 3,
            paddingRight: 4,
            border: `1.5px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            overflowY: 'auto',
            flexGrow: 1,
            caretColor: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              borderColor: theme.palette.mode === 'light' ? grey[400] : 'white'
            }
          },
          sxChildren
        )}
      >
        {clipboardValue ? (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              color: 'text.secondary'
            }}
          >
            <ClipboardCopy value={clipboardValue} />
          </Box>
        ) : null}
        {children}
      </Box>
    </Stack>
  );
}
