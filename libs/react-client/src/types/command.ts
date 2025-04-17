export interface ICommand {
  id: string;
  icon: string;
  description: string;
  button?: boolean;
  persistent?: boolean;
}

export interface IToggleCommand {
  id: string;
  icon: string;
  description: string;
  persistent?: boolean;
}
