import { Box, ListItem, ListItemButton, useTheme } from '@mui/material';
import { ITask } from './types';
import { TaskStatusIcon } from './TaskStatusIcon';

export const Task = ({ index, task }: { index: number; task: ITask }) => {
  const theme = useTheme();
  return (
    <ListItem disableGutters className={`task task-status-${task.status}`}>
      <ListItemButton
        sx={{
          color:
            {
              ready: theme.palette.mode === 'dark' ? '#E0E0E0' : '#616161',
              running: theme.palette.primary.contrastText,
              done: '#9E9E9E',
              failed: '#9E9E9E'
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
