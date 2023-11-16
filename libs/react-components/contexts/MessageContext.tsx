import { createContext } from 'react';

import { IMessageContext } from 'src/types/messageContext';

const defaultMessageContext = {
  avatars: [],
  defaultCollapseContent: false,
  expandAll: false,
  hideCot: false,
  highlightedMessage: null,
  loading: false,
  onElementRefClick: undefined,
  onFeedbackUpdated: undefined,
  onPlaygroundButtonClick: undefined,
  showFeedbackButtons: true,
  onError: () => undefined,
  uiName: ''
};

const MessageContext = createContext<IMessageContext>(defaultMessageContext);

export { MessageContext, defaultMessageContext };
