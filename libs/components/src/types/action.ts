export interface IAction {
  description?: string;
  forId: string;
  id: string;
  label?: string;
  name: string;
  onClick: () => void;
  value: string;
}
