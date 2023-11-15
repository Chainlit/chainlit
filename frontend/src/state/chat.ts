import { atom } from 'recoil';

import { IFileElement } from '@chainlit/react-client';

export const attachmentsState = atom<IFileElement[]>({
  key: 'Attachments',
  default: []
});
