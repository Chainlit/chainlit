import type {
  IAsk,
  IAvatarElement,
  IFeedback,
  IMessageElement,
  IStep
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
  onPlaygroundButtonClick?: (step: IStep) => void;
  onElementRefClick?: (element: IMessageElement) => void;
  onFeedbackUpdated?: (
    message: IStep,
    onSuccess: () => void,
    feedback: IFeedback
  ) => void;
  onError: (error: string) => void;
}

export type { IMessageContext };
