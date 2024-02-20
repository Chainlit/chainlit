import { IElement } from './element';
import { IStep } from './step';
import { IUser } from './user';

export interface IThread {
  id: string;
  createdAt: number | string;
  name?: string;
  user?: IUser;
  metadata?: Record<string, any>;
  steps: IStep[];
  elements?: IElement[];
}
