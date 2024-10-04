import type {
  IAsk,
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
  defaultCollapseContent: boolean;
  highlightedMessage: string | null;
  loading: boolean;
  showFeedbackButtons: boolean;
  uiName: string;
  allowHtml?: boolean;
  latex?: boolean;
  onElementRefClick?: (element: IMessageElement) => void;
  onFeedbackUpdated?: (
    message: IStep,
    onSuccess: () => void,
    feedback: IFeedback
  ) => void;
  onFeedbackDeleted?: (
    message: IStep,
    onSuccess: () => void,
    feedbackId: string
  ) => void;
  onError: (error: string) => void;
}

export type { IMessageContext };
