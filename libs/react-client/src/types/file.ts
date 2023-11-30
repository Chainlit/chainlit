import { IAction } from './action';
import { IStep } from './step';

export interface FileSpec {
  accept?: string[] | Record<string, string[]>;
  max_size_mb?: number;
  max_files?: number;
}

export interface ActionSpec {
  keys?: string[];
}

export interface IFileResponse {
  name: string;
  path?: string;
  size: number;
  type: string;
  content: ArrayBuffer;
}

export interface IAsk {
  callback: (payload: IStep | IFileResponse[] | IAction) => void;
  spec: {
    type: 'text' | 'file' | 'action';
    timeout: number;
  } & FileSpec &
    ActionSpec;
}
