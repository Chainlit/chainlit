import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import { Box, Chip, List, Theme, useTheme } from '@mui/material';

import { useApi, useChatData } from '@chainlit/react-client';
import { grey } from '@chainlit/react-components/theme';

import { Translator } from 'components/i18n';

import { apiClientState } from 'state/apiClient';

import { ITaskList, Task } from './Task';

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
        sx={{
          flexGrow: '1',
          fontWeight: '600',
          paddingLeft: theme.spacing(1),
          fontFamily: theme.typography.fontFamily
        }}
      >
        <Translator path="components.molecules.tasklist.TaskList.title" />
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
  borderLeft: `1px solid ${theme.palette.divider}`,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: theme.typography.fontFamily!,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0px 4px 20px 0px rgba(0, 0, 0, 0.20)'
      : '0px 4px 20px 0px rgba(0, 0, 0, 0.05)'
});

const TaskList = ({ isMobile }: { isMobile: boolean }) => {
  const theme = useTheme();
  const { tasklists } = useChatData();
  const apiClient = useRecoilValue(apiClientState);

  const tasklist = tasklists[tasklists.length - 1];

  // We remove the base URL since the useApi hook is already set with a base URL.
  // This ensures we only pass the relative path and search parameters to the hook.
  const url = useMemo(() => {
    if (!tasklist?.url) return null;
    const parsedUrl = new URL(tasklist.url);
    return parsedUrl.pathname + parsedUrl.search;
  }, [tasklist?.url]);

  const { isLoading, error, data } = useApi<ITaskList>(
    apiClient,
    url ? url : null,
    {
      keepPreviousData: true
    }
  );

  if (!url) return null;

  if (isLoading && !data) {
    return (
      <div>
        <Translator path="components.molecules.tasklist.TaskList.loading" />
      </div>
    );
  } else if (error) {
    return (
      <div>
        <Translator path="components.molecules.tasklist.TaskList.error" />
      </div>
    );
  }

  const content = data as ITaskList;

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
};

export { TaskList };
