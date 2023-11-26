import type {
  IAsk,
  IAvatarElement,
  IMessage,
  IMessageElement
} from 'client-types/';

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
  allowHtml?: boolean;
  latex?: boolean;
  onPlaygroundButtonClick?: (message: IMessage) => void;
  onElementRefClick?: (element: IMessageElement) => void;
  onFeedbackUpdated?: (
    message: IMessage,
    feedback: number,
    onSuccess: () => void,
    feedbackComment?: string
  ) => void;
  onError: (error: string) => void;
}

export type { IMessageContext };
