import { atom } from 'recoil';

export interface IProjectSettings {
  chainlitServer: string;
  prod: boolean;
  markdown?: string;
  ui: {
    name: string;
    description?: string;
    hide_cot?: boolean;
    default_expand_messages?: boolean;
    github?: string;
  };
  project: {
    id?: string;
    public?: boolean;
    user_env?: string[];
  };
}

export const projectSettingsState = atom<IProjectSettings | undefined>({
  key: 'ProjectSettings',
  default: undefined
});
