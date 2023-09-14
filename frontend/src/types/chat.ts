import { Socket } from 'socket.io-client';

import { IMessage } from '@chainlit/components';

import { IMessageElement } from './element';
import { IAppUser } from './user';

export interface IChat {
  id: number;
  createdAt: number | string;
  appUser?: IAppUser;
  messages: IMessage[];
  elements: IMessageElement[];
}

export interface IMessageUpdate extends IMessage {
  newId?: string;
}

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
}

export interface ISession {
  socket: Socket;
  error?: boolean;
}
