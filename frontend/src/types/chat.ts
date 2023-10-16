import { Socket } from 'socket.io-client';

import { IMessage, IMessageElement } from '@chainlit/components';

import { IAppUser } from './user';

export interface IChat {
  id: string;
  createdAt: number | string;
  appUser?: IAppUser;
  messages: IMessage[];
  elements: IMessageElement[];
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
