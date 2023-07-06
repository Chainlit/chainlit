export interface ITask {
  title: string;
  status: 'ready' | 'running' | 'done' | 'failed';
  forId?: string;
}

export interface ITaskList {
  status: 'ready' | 'running' | 'done';
  tasks: ITask[];
}
