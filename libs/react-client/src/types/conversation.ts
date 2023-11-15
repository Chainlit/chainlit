import { IElement } from './element';
import { IMessage } from './message';
import { IAppUser } from './user';

export interface IConversation {
  id: string;
  createdAt: number | string;
  appUser?: IAppUser;
  metadata?: Record<string, any>;
  messages: IMessage[];
  elements: IElement[];
}
