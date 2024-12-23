import { Button } from "@/components/ui/button";
import { useSetRecoilState } from "recoil";
import { TaskStatusIcon } from "./TaskStatusIcon";

export interface ITask {
  title: string;
  status: "ready" | "running" | "done" | "failed";
  forId?: string;
}

export interface ITaskList {
  status: "ready" | "running" | "done";
  tasks: ITask[];
}

interface TaskProps {
  index: number;
  task: ITask;
}

export const Task = ({ index, task }: TaskProps) => {

  const handleClick = () => {
    if (task.forId) {
      const element = document.getElementById(`message-${task.forId}`);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start",
      });
    }
  };

  const statusStyles = {
    ready: "text-gray-700 dark:text-gray-300",
    running: "text-gray-900 dark:text-gray-100 font-bold",
    done: "text-gray-500",
    failed: "text-gray-500",
  };

  return (
    <li className={`task task-status-${task.status}`}>
      <Button
        variant="ghost"
        className={`w-full flex items-start text-sm leading-snug ${statusStyles[task.status]}`}
        onClick={handleClick}
        disabled={!task.forId}
      >
        <span className="flex-none w-[18px] pr-4">{index}</span>
        <TaskStatusIcon status={task.status} />
        <span className="pl-8">{task.title}</span>
      </Button>
    </li>
  );
};