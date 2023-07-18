import { green, grey, primary, white } from 'palette';

import { Box, CircularProgress, SvgIcon } from '@mui/material';

import { ITask } from './types';

export const TaskStatusIcon = ({ status }: { status: ITask['status'] }) => {
  if (status === 'running') {
    return (
      <Box
        sx={{
          marginTop: '-2px',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: grey[700]
        }}
      >
        <CircularProgress color="inherit" size={18} />
      </Box>
    );
  }

  return (
    <SvgIcon
      width={24}
      height={24}
      sx={{
        marginTop: '-2px',
        fill: 'none'
      }}
    >
      {status === 'done' && (
        <>
          <circle cx={12} cy={12} r={9} fill={green[500]} />
          <path
            stroke={white}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m15.333 9.5-4.583 4.583L8.667 12"
          />
        </>
      )}
      {status === 'ready' && (
        <circle cx={12} cy={12} r={8.25} stroke={grey[700]} strokeWidth={1.5} />
      )}
      {status === 'failed' && (
        <>
          <circle cx={12} cy={12} r={9} fill={primary[500]} />
          <path
            stroke={white}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m14.5 9.5-5 5m0-5 5 5"
          />
        </>
      )}
    </SvgIcon>
  );
};
