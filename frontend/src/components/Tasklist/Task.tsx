import { Markdown } from '@/components/Markdown';

import { TaskStatusIcon } from './TaskStatusIcon';

export interface ITask {
  title: string;
  status: 'ready' | 'running' | 'done' | 'failed';
  forId?: string;
}

export interface ITaskList {
  status: 'ready' | 'running' | 'done';
  tasks: ITask[];
}

interface TaskProps {
  index: number;
  task: ITask;
  allowHtml?: boolean;
  latex?: boolean;
}

export const Task = ({ index, task, allowHtml, latex }: TaskProps) => {
  const statusStyles = {
    ready: '',
    running: 'font-semibold',
    done: 'text-muted-foreground',
    failed: 'text-muted-foreground'
  };

  const handleClick = () => {
    if (task.forId) {
      const parent = document.getElementById(`step-${task.forId}`);
      if (parent) {
        // Find the child div below the main step container
        const child = parent.querySelector('div');
        if (child) {
          child.classList.add('bg-card', 'rounded');
          parent.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
          });
          setTimeout(() => {
            child.classList.remove('bg-card', 'rounded');
          }, 600); // 2 blinks at 0.3s each
        }
      }
    }
  };

  return (
    <div className={`task task-status-${task.status}`}>
      <div
        className={`w-full grid grid-cols-[auto_auto_1fr] items-start gap-1.5 font-medium py-0.5 px-1 text-sm leading-tight ${
          statusStyles[task.status]
        } ${task.forId ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleClick}
      >
        <div className="text-xs text-muted-foreground text-right pr-1 pt-[1px]">
          {index}
        </div>
        <div className="flex items-start pt-[1px]">
          <TaskStatusIcon status={task.status} />
        </div>
        <div className="min-w-0">
          <Markdown
            allowHtml={allowHtml}
            latex={latex}
            className="max-w-none prose-sm text-left break-words [&_p]:m-0 [&_p]:leading-snug [&_div]:leading-snug [&_div]:mt-0 [&_strong]:font-semibold"
          >
            {task.title}
          </Markdown>
        </div>
      </div>
    </div>
  );
};
