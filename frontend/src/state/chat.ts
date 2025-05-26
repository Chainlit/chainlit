import { atom } from 'recoil';

import { ICommand } from 'client-types/*';
import { ICustomWidgetElement } from 'types/widgets';

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

export const customWidgetDefinitionsState = atom<ICustomWidgetElement[]>({
  key: 'CustomWidgetDefinitions',
  default: []
});

export interface IWidgetValues {
  [widgetId: string]: string | number | boolean | string[] | undefined;
}

export const customWidgetValuesState = atom<IWidgetValues>({
  key: 'CustomWidgetValues',
  default: {}
});
