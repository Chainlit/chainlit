import { grey } from 'palette';

import { Box, Chip, List, Theme, useTheme } from '@mui/material';

import { ITasklistElement } from 'state/element';

import { Task } from './Task';
import { ITaskList } from './types';

const Header = ({ status }: { status: string }) => {
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
          color: theme.palette.mode === 'dark' ? grey[500] : grey[600]
        }}
      />
    </Box>
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
  let content: ITaskList | null = null;

  try {
    if (rawTasklist?.content) {
      content = JSON.parse(rawTasklist.content);
    }
  } catch (e) {
    console.error(e);
    content = null;
  }

  if (!content) {
    return null;
  }

  const tasks = content.tasks;

  if (isMobile) {
    // Get the first running or ready task, or the latest task
    let highlightedTaskIndex = tasks.length - 1;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].status === 'running' || tasks[i].status === 'ready') {
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
        className="tasklist tasklist-mobile"
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
      className="tasklist tasklist-desktop"
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
