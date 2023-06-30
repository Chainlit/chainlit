import { Box, ListItem, ListItemButton, useTheme } from '@mui/material';
import { ITask } from './types';
import { TaskStatusIcon } from './TaskStatusIcon';
import { grey } from 'palette';

export const Task = ({ index, task }: { index: number; task: ITask }) => {
  const theme = useTheme();
  return (
    <ListItem disableGutters className={`task task-status-${task.status}`}>
      <ListItemButton
        sx={{
          color:
            {
              ready: theme.palette.mode === 'dark' ? grey[300] : grey[700],
              running: theme.palette.primary.contrastText,
              done: grey[500],
              failed: grey[500]
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
            flex: '0 0 18px',
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
