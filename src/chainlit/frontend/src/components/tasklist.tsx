import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  SvgIcon,
  Theme,
  useTheme
} from '@mui/material';
import { ITasklistElement } from 'state/element';
import { useEffect, useState } from 'react';

interface ITask {
  title: string;
  status: 'ready' | 'running' | 'done';
}

interface ITaskList {
  status: 'ready' | 'running' | 'done';
  tasks: ITask[];
}

const TaskStatusIcon = ({ status }: { status: ITask['status'] }) => (
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

const Header = ({ status }: { status: ITask['status'] }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        padding: theme.spacing(2)
      }}
    >
      <Box
        sx={{ flexGrow: '1', fontWeight: '600', paddingLeft: theme.spacing(1) }}
      >
        🗒️ Task List
      </Box>
      <Chip
        label={status || '?'}
        sx={{
          fontWeight: '500',
          borderRadius: '4px',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.mode === 'dark' ? '#9E9E9E' : '#757575'
        }}
      />
    </Box>
  );
};

const Task = ({ index, task }: { index: number; task: ITask }) => {
  const theme = useTheme();
  return (
    <ListItem disableGutters>
      <ListItemButton
        sx={{
          color:
            {
              ready: theme.palette.mode === 'dark' ? '#E0E0E0' : '#616161',
              running: theme.palette.primary.contrastText,
              done: '#9E9E9E'
            }[task.status] || theme.palette.text.secondary,
          fontWeight: task.status === 'running' ? '700' : '500',
          alignItems: 'flex-start',
          fontSize: '14px',
          lineHeight: 1.36
        }}
      >
        <Box
          sx={{
            paddingRight: theme.spacing(1),
            width: '18px'
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

const taskListContainerStyles = (theme: Theme) => ({
  background: theme.palette.background.paper,
  borderRadius: '4px',
  border: `1px solid ${theme.palette.divider}`,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0px 4px 20px 0px rgba(0, 0, 0, 0.20)'
      : '0px 4px 20px 0px rgba(0, 0, 0, 0.05)'
});

export default function TaskList({
  tasklist: rawTasklist,
  isMobile
}: {
  tasklist?: ITasklistElement;
  isMobile: boolean;
}) {
  const theme = useTheme();
  const [content, setContent] = useState<ITaskList | null>(null);

  useEffect(() => {
    if (!rawTasklist?.content) return;
    setContent(JSON.parse(rawTasklist.content));
  }, [rawTasklist, setContent]);

  if (!content) {
    return null;
  }

  const tasks = content.tasks;

  if (isMobile) {
    // Get the first running or ready task, or the latest task done
    let highlightedTaskIndex = tasks.length - 1;
    for (let i = 0; i < tasks.length; i++) {
      if (
        tasks[i].status === 'running' ||
        tasks[i].status === 'ready'
      ) {
        highlightedTaskIndex = i;
        break;
      }
    }
    const highlightedTask = tasks?.[highlightedTaskIndex];

    return (
      <Box
        component="aside"
        sx={{
          color: theme.palette.text.primary,
          padding: theme.spacing(2),
          width: '100%',
          boxSizing: 'border-box',
          display: {
            xs: 'flex',
            md: 'none'
          }
        }}
      >
        <Box
          sx={{
            ...taskListContainerStyles(theme)
          }}
        >
          <Header status={content.status} />
          {highlightedTask && (
            <List>
              <Task index={highlightedTaskIndex + 1} task={highlightedTask} />
            </List>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="aside"
      sx={{
        color: theme.palette.text.primary,
        padding: theme.spacing(2),
        width: '380px',
        flexShrink: '0',
        display: {
          xs: 'none',
          md: 'flex'
        }
      }}
    >
      <Box
        sx={{
          ...taskListContainerStyles(theme)
        }}
      >
        <Header status={content?.status} />
        <Box
          sx={{
            overflowY: 'auto'
          }}
        >
          <List>
            {tasks?.map((task, index) => (
              <Task key={index} index={index + 1} task={task} />
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
