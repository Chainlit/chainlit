import { Box, Stack, Typography } from '@mui/material';

import { primary } from '../../theme/palette';

interface AuthTemplateProps {
  children: React.ReactNode;
  content: string;
  renderLogo?: React.ReactElement;
  title: string;
}

const AuthTemplate = ({
  title,
  content,
  children,
  renderLogo
}: AuthTemplateProps): JSX.Element => {
  return (
    <Stack
      sx={{
        backgroundColor: primary['600'],
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={(theme) => ({
          backgroundColor: 'white',
          borderRadius: 1,
          padding: theme.spacing(5, 5),
          width: '100%',
          height: '100%',

          [theme.breakpoints.up('sm')]: {
            maxWidth: '400px',
            height: 'auto',
            maxHeight: '90%'
          }
        })}
      >
        <Stack
          sx={{
            alignItems: 'center',
            gap: 3,
            marginBottom: 3
          }}
        >
          {renderLogo}
          <Typography>{title}</Typography>
          <Typography>{content}</Typography>
        </Stack>
        <Stack gap={1} paddingX={3}>
          {children}
        </Stack>
      </Box>
    </Stack>
  );
};

export { AuthTemplate };
