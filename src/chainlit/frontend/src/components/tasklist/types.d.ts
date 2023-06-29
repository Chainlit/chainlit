export interface ITask {
  title: string;
  status: 'ready' | 'running' | 'done' | 'failed';
}

export interface ITaskList {
  status: 'ready' | 'running' | 'done';
  tasks: ITask[];
}
