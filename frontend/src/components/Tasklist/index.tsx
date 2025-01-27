import { cn } from '@/lib/utils';
import useSWR from 'swr';

import { useChatData } from '@chainlit/react-client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { ITaskList, Task } from './Task';

interface HeaderProps {
  status: string;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json());

const Header = ({ status }: HeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="font-semibold">Tasks</div>
      <Badge variant="secondary">{status || '?'}</Badge>
    </CardHeader>
  );
};

interface TaskListProps {
  isMobile: boolean;
  isCopilot?: boolean;
}

const TaskList = ({ isMobile, isCopilot }: TaskListProps) => {
  const { tasklists } = useChatData();
  const tasklist = tasklists[tasklists.length - 1];

  const { error, data, isLoading } = useSWR<ITaskList>(tasklist?.url, fetcher, {
    keepPreviousData: true
  });

  if (!tasklist?.url) return null;

  if (isLoading && !data) {
    return null;
  }

  if (error) {
    return null;
  }

  const content = data as ITaskList;
  if (!content) return null;

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
      <aside
        className={cn('w-full tasklist-mobile', !isCopilot && 'md:hidden')}
      >
        <Card>
          <Header status={content.status} />
          {highlightedTask && (
            <CardContent>
              <Task index={highlightedTaskIndex + 1} task={highlightedTask} />
            </CardContent>
          )}
        </Card>
      </aside>
    );
  }

  return (
    <aside className="hidden tasklist max-w-96 flex-grow md:block overflow-y-auto mr-4 mb-4">
      <Card className="overflow-y-auto h-full">
        <Header status={content?.status} />
        <CardContent className="flex flex-col gap-2">
          {tasks?.map((task, index) => (
            <Task key={index} index={index + 1} task={task} />
          ))}
        </CardContent>
      </Card>
    </aside>
  );
};

export { TaskList };
