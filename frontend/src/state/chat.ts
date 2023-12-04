import { atom } from 'recoil';

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
