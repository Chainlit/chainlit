import { useSetRecoilState } from 'recoil';

import {
  IThread,
  currentThreadIdState,
  firstUserInteraction,
  messagesState,
  useChatInteract
} from '@chainlit/react-client';

import { threadStorage } from './ThreadStorageService';
import {
  createAnalyticsDataMessage,
  createResumeChatMessage
} from './actionConstructor';

export class ChatService {
  private setCurrentThreadId;
  private setFirstInteraction;
  private setMessages;
  private setIdToResume;
  private callAction;

  constructor() {
    this.setCurrentThreadId = useSetRecoilState(currentThreadIdState);
    this.setFirstInteraction = useSetRecoilState(firstUserInteraction);
    this.setMessages = useSetRecoilState(messagesState);
    const { setIdToResume, callAction } = useChatInteract();
    this.setIdToResume = setIdToResume;
    this.callAction = callAction;
  }

  public async initChat(): Promise<void> {
    try {
      const thread = await threadStorage.getLastThread();
      if (!thread?.steps?.length) return;

      await this.restoreThread(thread);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      throw err;
    }
  }

  public async sendPageAnalytics(
    threadId: string,
    pageData: { url: string; name: string }
  ): Promise<void> {
    if (!threadId) return;

    const analyticsDataAction = createAnalyticsDataMessage(threadId, pageData);
    await this.callAction(analyticsDataAction);
  }

  private async restoreThread(thread: IThread): Promise<void> {
    this.setCurrentThreadId(thread.id);
    this.setIdToResume(thread.id);
    this.setMessages(thread.steps);
    this.setFirstInteraction('resume');

    const resumeAction = createResumeChatMessage(thread);
    await this.callAction(resumeAction);
  }
}

export const useChatService = () => {
  return new ChatService();
};
