import type {
  IAsk,
  IAvatarElement,
  IFeedback,
  IFileRef,
  IMessageElement,
  IStep
} from 'client-types/';

interface IMessageContext {
  uploadFile?: (
    file: File,
    onProgress: (progress: number) => void
  ) => { xhr: XMLHttpRequest; promise: Promise<IFileRef> };
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
