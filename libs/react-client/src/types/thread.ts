import { IElement } from './element';
import { IMessage } from './message';
import { IStep } from './step';
import { IUser } from './user';

export interface IThread {
  id: string;
  createdAt: number | string;
  user?: IUser;
  metadata?: Record<string, any>;
  messages: IMessage[];
  steps: IStep[];
  elements: IElement[];
}
