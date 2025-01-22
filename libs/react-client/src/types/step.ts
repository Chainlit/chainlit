import { IFeedback } from './feedback';

type StepType =
  | 'assistant_message'
  | 'user_message'
  | 'system_message'
  | 'run'
  | 'tool'
  | 'llm'
  | 'embedding'
  | 'retrieval'
  | 'rerank'
  | 'undefined';

export interface IStep {
  id: string;
  name: string;
  type: StepType;
  threadId?: string;
  parentId?: string;
  isError?: boolean;
  command?: string;
  showInput?: boolean | string;
  waitForAnswer?: boolean;
  input?: string;
  output: string;
  createdAt: number | string;
  start?: number | string;
  end?: number | string;
  feedback?: IFeedback;
  language?: string;
  streaming?: boolean;
  steps?: IStep[];
  metadata?: Record<string, any>;
  //legacy
  indent?: number;
}
