import { atom } from "recoil";

export const projectSettingsState = atom<
  | {
      public: boolean;
      chainlitServer: string;
      hideCot: boolean;
      projectId?: string;
      userEnv?: string[];
      chainlitMd?: string;
      dev: boolean;
    }
  | undefined
>({
  key: "ProjectSettings",
  default: undefined,
});
