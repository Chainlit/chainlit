import { MessageRole, StepOrMessage } from '.';
import { IFileElement } from './element';
import { IFeedback } from './feedback';

export interface IMessage {
  author: string;
  role: MessageRole;
  content?: string;
  createdAt: number | string;
  disableFeedback?: boolean;
  feedback?: IFeedback;
  elements?: IFileElement[];
  id: string;
  isError?: boolean;
  language?: string;
  streaming?: boolean;
  waitForAnswer?: boolean;
  steps?: StepOrMessage[];
  //legacy
  indent?: number;
}
