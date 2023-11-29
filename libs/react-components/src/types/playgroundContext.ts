import type { IGeneration } from 'client-types/';
import { IPlayground, PromptMode } from 'src/types/playground';

interface IPlaygroundContext {
  variableName?: string;
  setVariableName: (
    name?: string | ((name?: string) => string | undefined)
  ) => void;
  functionIndex?: number;
  setFunctionIndex: (
    index?: number | ((index?: number) => number | undefined)
  ) => void;
  promptMode: PromptMode;
  setPromptMode: (
    mode: PromptMode | ((mode: PromptMode) => PromptMode)
  ) => void;
  setPlayground: (
    playground?:
      | IPlayground
      | ((playground?: IPlayground) => IPlayground | undefined)
  ) => void;
  playground?: IPlayground;
  onNotification: (type: 'success' | 'error', content: string) => void;
  createCompletion?: (
    generation: IGeneration,
    controller: AbortController,
    cb: (done: boolean, token: string) => void
  ) => Promise<unknown>;
}

export { IPlaygroundContext };
