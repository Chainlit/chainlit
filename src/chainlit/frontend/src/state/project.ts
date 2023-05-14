import { atom } from 'recoil';

export const projectSettingsState = atom<
  | {
      public: boolean;
      chainlitServer: string;
      hideCot: boolean;
      dev: boolean;
      appTitle: string;
      projectId?: string;
      userEnv?: string[];
      github?: string;
      chainlitMd?: string;
    }
  | undefined
>({
  key: 'ProjectSettings',
  default: undefined
});
