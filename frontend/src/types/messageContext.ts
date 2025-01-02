import type {
  IAsk,
  IFeedback,
  IFileRef,
  IMessageElement,
  IStep
} from '@chainlit/react-client';

interface IMessageContext {
  uploadFile?: (
    file: File,
    onProgress: (progress: number) => void
  ) => { xhr: XMLHttpRequest; promise: Promise<IFileRef> };
  cot: 'hidden' | 'tool_call' | 'full';
  askUser?: IAsk;
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
