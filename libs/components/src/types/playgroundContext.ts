import { IPlayground, PromptMode } from 'src/types/playground';

import { IPrompt } from './message';

interface IPlaygroundContext {
  variableName?: string;
  setVariableName: (
    name?: string | ((name?: string) => string | undefined)
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
    prompt: IPrompt,
    controller: AbortController,
    cb: (done: boolean, token: string) => void
  ) => Promise<unknown>;
}

export { IPlaygroundContext };
