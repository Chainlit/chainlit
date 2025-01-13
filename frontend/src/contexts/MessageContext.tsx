import { createContext } from 'react';

import { IMessageContext } from 'types/messageContext';

const defaultMessageContext = {
  highlightedMessage: null,
  loading: false,
  onElementRefClick: undefined,
  onFeedbackUpdated: undefined,
  showFeedbackButtons: true,
  onError: () => undefined,
  uiName: '',
  cot: 'hidden' as const
};

const MessageContext = createContext<IMessageContext>(defaultMessageContext);

export { MessageContext, defaultMessageContext };
