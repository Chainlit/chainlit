import { atom } from 'recoil';

export interface IProjectSettings {
  markdown?: string;
  ui: {
    name: string;
    description?: string;
    hide_cot?: boolean;
    default_collapse_content?: boolean;
    default_expand_messages?: boolean;
    github?: string;
  };
  userEnv: string[];
  dataPersistence: boolean;
}

export const projectSettingsState = atom<IProjectSettings | undefined>({
  key: 'ProjectSettings',
  default: undefined
});
