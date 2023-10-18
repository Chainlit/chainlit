import { IAvatarElement, IMessageElement } from './element';
import { IAsk } from './file';
import { IMessage } from './message';

interface IMessageContext {
  askUser?: IAsk;
  avatars: IAvatarElement[];
  defaultCollapseContent: boolean;
  expandAll: boolean;
  hideCot: boolean;
  highlightedMessage: string | null;
  loading: boolean;
  showFeedbackButtons: boolean;
  uiName: string;
  onPlaygroundButtonClick?: (message: IMessage) => void;
  onElementRefClick?: (element: IMessageElement) => void;
  onFeedbackUpdated?: (
    messageId: string,
    feedback: number,
    onSuccess: () => void,
    feedbackComment?: string
  ) => void;
  onError: (error: string) => void;
}

export type { IMessageContext };
