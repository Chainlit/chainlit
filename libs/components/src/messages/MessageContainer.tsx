import { MessageContext } from 'contexts/MessageContext';
import { useEffect, useRef } from 'react';

import Box from '@mui/material/Box';

import { IAction } from 'src/types/action';
import { IMessageElement } from 'src/types/element';
import { INestedMessage } from 'src/types/message';
import { IMessageContext } from 'src/types/messageContext';

import { Messages } from './Messages';

interface Props {
  actions: IAction[];
  autoScroll?: boolean;
  context: IMessageContext;
  elements: IMessageElement[];
  messages: INestedMessage[];
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
        flexGrow={1}
        sx={{
          overflowY: 'auto'
        }}
        onScroll={handleScroll}
      >
        <Messages
          indent={0}
          messages={messages}
          elements={elements}
          actions={actions}
        />
      </Box>
    </MessageContext.Provider>
  );
};

export { MessageContainer };
