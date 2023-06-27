import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  SvgIcon,
  useTheme
} from '@mui/material';

const TaskStatusIcon = ({ status }) => (
  <SvgIcon
    sx={{
      marginTop: '-2px'
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none">
      {status === 'done' && (
        <>
          <circle cx={12} cy={12} r={9} fill="#20A56D" />
          <path
            stroke="#fff"
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
              stroke="#757575"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 1.833V5.5m0 11v3.667M5.5 11H1.833m18.334 0H16.5m.988 6.489-2.592-2.593m2.592-10.313-2.592 2.593M4.51 17.49l2.593-2.593M4.511 4.583l2.593 2.593"
            />
          </g>
          <defs>
            <clipPath id="a">
              <path fill="#fff" d="M0 0h22v22H0z" />
            </clipPath>
          </defs>
        </>
      )}
      {status !== 'done' && status !== 'running' && (
        <circle cx={12} cy={12} r={8.25} stroke="#616161" strokeWidth={1.5} />
      )}
    </svg>
  </SvgIcon>
);

const Task = ({ index, task }) => {
  const theme = useTheme();
  return (
    <ListItem disableGutters>
      <ListItemButton
        sx={{
          color:
            task.status === 'running'
              ? theme.palette.primary.contrastText
              : theme.palette.text.secondary,
          fontWeight: task.status === 'running' ? '700' : '500',
          alignItems: 'flex-start',
          fontSize: '14px',
          lineHeight: 1.36
        }}
      >
        <Box
          sx={{
            paddingRight: theme.spacing(1)
          }}
        >
          {index}
        </Box>
        <TaskStatusIcon status={task.status} />
        <Box
          sx={{
            paddingLeft: theme.spacing(2)
          }}
        >
          {task.title}
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

const tasks = [
  {
    title: 'Conduct research on the root causes of world hunger',
    status: 'done'
  },
  {
    title: 'Identify regions and populations most affected by hunger',
    status: 'done'
  },
  {
    title:
      'Develop partnerships with local organizations and governments to address...',
    status: 'done'
  },
  {
    title:
      'Implement sustainable agriculture practices to increase food production',
    status: 'running'
  },
  {
    title: 'Provide education and resources on nutrition and food preparation',
    status: 'not started'
  },
  {
    title: 'Establish food banks and distribution centers in areas of need',
    status: 'not started'
  },
  {
    title:
      'Advocate for policy changes to address systemic issues contributing to hunger',
    status: 'not started'
  },
  {
    title: 'Raise awareness and funds through public campaigns and events',
    status: 'not started'
  },
  {
    title: 'Raise awareness and funds through public campaigns and events',
    status: 'not started'
  },
  {
    title: 'Raise awareness and funds through public campaigns and events',
    status: 'not started'
  },
  {
    title: 'Raise awareness and funds through public campaigns and events',
    status: 'not started'
  },
  {
    title: 'Raise awareness and funds through public campaigns and events',
    status: 'not started'
  }
];

export default function TaskList({ tasklist }) {
  const theme = useTheme();
  return (
    <Box
      component="aside"
      sx={{
        color: theme.palette.text.primary,
        padding: theme.spacing(2),
        display: 'flex',
        width: '380px'
      }}
    >
      <Box
        sx={{
          background: theme.palette.divider,
          borderRadius: '4px',

          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
            padding: theme.spacing(2)
          }}
        >
          <Box sx={{ flexGrow: '1', fontWeight: '600' }}>Task list</Box>
          <Chip label={tasklist?.status || '?'} />
        </Box>
        <Box
          sx={{
            overflowY: 'auto'
          }}
        >
          <List>
            {tasklist?.content?.map((task, index) => (
              <Task key={index} index={index + 1} task={task} />
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
