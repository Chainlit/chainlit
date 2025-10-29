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
}

export const Task = ({ index, task }: TaskProps) => {
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
        className={`w-full flex font-medium py-2 text-sm leading-snug ${
          statusStyles[task.status]
        } ${task.forId ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleClick}
      >
        <span className="flex-none w-8 pr-2">{index}</span>
        <TaskStatusIcon status={task.status} />
        <span className="pl-2">{task.title}</span>
      </div>
    </div>
  );
};
