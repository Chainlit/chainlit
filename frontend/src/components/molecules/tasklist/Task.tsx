import { grey } from 'palette';
import { useSetRecoilState } from 'recoil';

import { Box, ListItem, ListItemButton, useTheme } from '@mui/material';

import { highlightMessage } from 'state/chat';

import { TaskStatusIcon } from './TaskStatusIcon';
import { ITask } from './types';

export const Task = ({ index, task }: { index: number; task: ITask }) => {
  const setHighlightedMessage = useSetRecoilState(highlightMessage);
  const theme = useTheme();
  return (
    <ListItem disableGutters className={`task task-status-${task.status}`}>
      <ListItemButton
        disableRipple={!task.forId}
        sx={{
          color:
            {
              ready: theme.palette.mode === 'dark' ? grey[300] : grey[700],
              running: theme.palette.mode === 'dark' ? grey[100] : grey[850],
              done: grey[500],
              failed: grey[500]
            }[task.status] || theme.palette.text.secondary,
          fontWeight: task.status === 'running' ? '700' : '500',
          alignItems: 'flex-start',
          fontSize: '14px',
          lineHeight: 1.36,
          cursor: task.forId ? 'pointer' : 'default'
        }}
        onClick={() => {
          if (task.forId) {
            setHighlightedMessage(task.forId);
            const element = document.getElementById(`message-${task.forId}`);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'start'
              });
            }
          }
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
