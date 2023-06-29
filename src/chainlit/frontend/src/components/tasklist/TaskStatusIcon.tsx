import { SvgIcon } from '@mui/material';
import { ITask } from './types';
import { green, grey, primary, white } from 'palette';

export const TaskStatusIcon = ({ status }: { status: ITask['status'] }) => (
  <SvgIcon
    sx={{
      marginTop: '-2px'
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none">
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
      {status === 'running' && (
        <>
          <g clipPath="url(#a)">
            <path
              stroke={grey[600]}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 1.833V5.5m0 11v3.667M5.5 11H1.833m18.334 0H16.5m.988 6.489-2.592-2.593m2.592-10.313-2.592 2.593M4.51 17.49l2.593-2.593M4.511 4.583l2.593 2.593"
            />
          </g>
          <defs>
            <clipPath id="a">
              <path fill={white} d="M0 0h22v22H0z" />
            </clipPath>
          </defs>
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
    </svg>
  </SvgIcon>
);
