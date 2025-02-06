import { Socket } from 'socket.io-client';

export interface ISession {
  socket: Socket;
  error?: boolean;
}
