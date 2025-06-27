import { atom } from 'recoil';

import { ICommand, IToggleCommand } from 'client-types/*';

export interface IAttachment {
  id: string;
  serverId?: string;
  name: string;
  size: number;
  type: string;
  uploadProgress?: number;
  uploaded?: boolean;
  cancel?: () => void;
  remove?: () => void;
}

export const attachmentsState = atom<IAttachment[]>({
  key: 'Attachments',
  default: []
});

export const persistentCommandState = atom<ICommand | undefined>({
  key: 'PersistentCommand',
  default: undefined
});

// 新增的可切换按钮状态
export interface IToggleable {
  id: string;
  active: boolean;
  persistent?: boolean;
}

export const toggleableStates = atom<IToggleable[]>({
  key: 'ToggleableStates',
  default: []
});
