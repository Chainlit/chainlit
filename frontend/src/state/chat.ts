import { atom } from 'recoil';

import { IFileElement } from '@chainlit/components';

export const attachmentsState = atom<IFileElement[]>({
  key: 'Attachments',
  default: []
});
