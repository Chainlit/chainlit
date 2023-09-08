import { useEffect, useRef } from 'react';

import { Box } from '@mui/material';

import { IAction } from '../types/action';
import { IMessageElement } from '../types/element';
import { IMessage } from '../types/message';
import { IMessageContext } from '../types/messageContext';

import { MessageContext } from '../../contexts/MessageContext';
import { nestMessages } from '../../utils/message';
import { Messages } from './Messages';

interface Props {
  actions: IAction[];
  autoScroll?: boolean;
  context: IMessageContext;
  elements: IMessageElement[];
  messages: IMessage[];
  setAutoScroll?: (autoScroll: boolean) => void;
}

const MessageContainer = ({
  actions,
  autoScroll,
  context,
  elements,
  messages,
  setAutoScroll
}: Props) => {
  const ref = useRef<HTMLDivElement>();
  const nestedMessages = nestMessages(messages);

  useEffect(() => {
    if (!ref.current || !autoScroll) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!ref.current || !setAutoScroll) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScroll(atBottom);
  };

  return (
    <MessageContext.Provider value={context}>
      <Box
        ref={ref}
        position="relative"
        display="flex"
        flexDirection="column"
        overflow="auto"
        flexGrow={1}
        onScroll={handleScroll}
      >
        <Messages
          indent={0}
          messages={nestedMessages}
          elements={elements}
          actions={actions}
        />
      </Box>
    </MessageContext.Provider>
  );
};

export { MessageContainer };
