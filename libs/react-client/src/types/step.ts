import { StepOrMessage } from '.';
import { IFeedback } from './feedback';
import { IGeneration } from './generation';

type StepType =
  | 'RUN'
  | 'TOOL'
  | 'LLM'
  | 'EMBEDDING'
  | 'RETRIEVAL'
  | 'RERANK'
  | 'UNDEFINED';

export interface IStep {
  id: string;
  name: string;
  type: StepType;
  threadId: string;
  parentId?: string;
  error?: string;
  input: string;
  output: string;
  createdAt: number | string;
  start: number | string;
  end: number | string;
  disableFeedback?: boolean;
  feedback?: IFeedback;
  language?: string;
  streaming?: boolean;
  generation?: IGeneration;
  steps?: StepOrMessage[];
}
