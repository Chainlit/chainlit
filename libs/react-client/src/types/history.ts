import { IThread } from 'src/types';

import { IPageInfo } from '..';

export type UserInput = {
  content: string;
  createdAt: number;
};

export type ThreadHistory = {
  threads?: IThread[];
  currentThreadId?: string;
  timeGroupedThreads?: { [key: string]: IThread[] };
  pageInfo?: IPageInfo;
};
