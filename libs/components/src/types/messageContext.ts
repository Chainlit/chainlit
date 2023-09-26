import { IAvatarElement, IMessageElement } from './element';
import { IAsk } from './file';
import { IFeedback, IMessage } from './message';

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
    value: IFeedback,
    onSuccess: () => void
  ) => void;
}

export type { IMessageContext };
