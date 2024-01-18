export interface IAction {
  description?: string;
  forId: string;
  id: string;
  label?: string;
  name: string;
  onClick: () => void;
  value: string;
  collapsed: boolean;
}

export interface ICallFn {
  callback: (payload: Record<string, any>) => void;
  name: string;
  args: Record<string, any>;
}
