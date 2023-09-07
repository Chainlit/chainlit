import { Socket } from 'socket.io-client';

import { IMessage } from '@chainlit/components';
import { FileSpec, IFileResponse } from '@chainlit/components/src/types/file';

import { IMessageElement } from './element';
import { IMember } from './user';

export interface IChat {
  id: number;
  createdAt: number | string;
  author?: IMember;
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

export interface IAskResponse {
  content: string;
  author: string;
}

export interface IAsk {
  callback: (payload: IAskResponse | IFileResponse[]) => void;
  spec: {
    type: 'text' | 'file';
    timeout: number;
  } & FileSpec;
}

export interface ISession {
  socket: Socket;
  error?: boolean;
}
