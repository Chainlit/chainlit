import { MessageContext, defaultMessageContext } from 'contexts/MessageContext';
import { memo, useEffect, useRef } from 'react';

import ExpandCircleDown from '@mui/icons-material/ExpandCircleDown';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import type { IAction, IMessageElement, IStep } from 'client-types/';
import { IMessageContext } from 'src/types/messageContext';

import { Messages } from './Messages';

interface Props {
  actions: IAction[];
  autoScroll?: boolean;
  context: IMessageContext;
  elements: IMessageElement[];
  messages: IStep[];
  setAutoScroll?: (autoScroll: boolean) => void;
}

const MessageContainer = memo(
  ({
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
      <MessageContext.Provider value={context || defaultMessageContext}>
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
          {!autoScroll ? (
            <IconButton
              sx={{
                width: 'fit-content',
                margin: 'auto',
                position: 'sticky',
                bottom: 0
              }}
              onClick={() => setAutoScroll && setAutoScroll(true)}
            >
              <ExpandCircleDown fontSize="large" />
            </IconButton>
          ) : null}
        </Box>
      </MessageContext.Provider>
    );
  }
);

export { MessageContainer };
