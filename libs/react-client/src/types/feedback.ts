export interface IFeedback {
  id?: string;
  forId?: string;
  comment?: string;
  strategy: 'BINARY';
  value: number;
}
