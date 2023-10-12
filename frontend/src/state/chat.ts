import { atom } from 'recoil';

import { IFileResponse } from '@chainlit/components';

export const attachmentsState = atom<IFileResponse[]>({
  key: 'Attachments',
  default: []
});
