import { atom } from "recoil";

export const accessTokenState = atom<string | undefined>({
  key: "AccessToken",
  default: undefined,
});

export const roleState = atom<
  "USER" | "ADMIN" | "OWNER" | "ANONYMOUS" | undefined
>({
  key: "Role",
  default: undefined,
});

const localUserEnv = localStorage.getItem("userEnv");

export const userEnvState = atom<Record<string, string>>({
  key: "UserEnv",
  default: localUserEnv ? JSON.parse(localUserEnv) : {},
});
