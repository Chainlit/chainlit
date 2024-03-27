import { DefaultExtensionType, FileIcon, defaultStyles } from 'react-file-icon';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface Props {
  name: string;
  mime: string;
  children?: React.ReactNode;
}

const Attachment = ({ name, mime, children }: Props) => {
  const extension = (
    mime ? mime.split('/').pop() : 'txt'
  ) as DefaultExtensionType;

  return (
    <Box
      position="relative"
      sx={(theme) => ({
        height: 50,
        [theme.breakpoints.down('sm')]: {
          height: 36
        }
      })}
    >
      {children}
      <Stack
        sx={(theme) => ({
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.2,
          borderRadius: 1,
          px: 1.2,
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          color: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.primary.main
              : theme.palette.text.primary,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
          width: 160,
          [theme.breakpoints.down('sm')]: {
            width: 'fit-content',
            maxWidth: 120
          }
        })}
      >
        <Box
          sx={(theme) => ({
            width: '2rem',
            [theme.breakpoints.down('sm')]: {
              width: '1.25rem'
            }
          })}
        >
          <FileIcon {...defaultStyles[extension]} extension={extension} />
        </Box>
        <Typography
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            fontSize: '0.8rem',
            width: '70%'
          }}
        >
          {name}
        </Typography>
      </Stack>
    </Box>
  );
};
export { Attachment };
