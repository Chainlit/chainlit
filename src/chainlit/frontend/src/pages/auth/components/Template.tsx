import { primary } from 'palette';
import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { Logo } from 'components/atoms/logo';

interface TemplateProps {
  title: string;
  content: string;
  children: React.ReactNode;
}

const Template = ({ title, content, children }: TemplateProps): JSX.Element => {
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
          <Logo width={140} />
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

export default Template;
