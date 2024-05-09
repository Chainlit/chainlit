import { IAction } from './action';
import { ICheckboxGroup } from './checkboxGroup';
import { IStep } from './step';

export interface FileSpec {
  accept?: string[] | Record<string, string[]>;
  max_size_mb?: number;
  max_files?: number;
}

export interface ActionSpec {
  keys?: string[];
}

export interface IFileRef {
  id: string;
}

export interface CheckboxGroupSpec {
}

export interface IAsk {
  callback: (payload: IStep | IFileRef[] | IAction | ICheckboxGroup) => void;
  spec: {
    type: 'text' | 'file' | 'action';
    timeout: number;
  } & FileSpec &
    ActionSpec &
    CheckboxGroupSpec;
}
