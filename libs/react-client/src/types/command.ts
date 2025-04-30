export interface ICommand {
  id: string;
  icon: string;
  description: string;
  button?: boolean;
  persistent?: boolean;
}
