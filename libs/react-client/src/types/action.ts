export interface IAction {
  label: string;
  forId: string;
  id: string;
  payload: Record<string, unknown>;
  name: string;
  onClick: () => void;
  tooltip: string;
  icon?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  fullWidth?: boolean;
  variant?: string;
  size?: string;
}

export interface ICallFn {
  callback: (payload: Record<string, any>) => void;
  name: string;
  args: Record<string, any>;
}
