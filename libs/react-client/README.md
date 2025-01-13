## Overview

The `@chainlit/react-client` package provides a set of React hooks as well as an API client to connect to your [Chainlit](https://github.com/Chainlit/chainlit) application from any React application. The package includes hooks for managing chat sessions, messages, data, and interactions.

## Installation

To install the package, run the following command in your project directory:

```sh
npm install @chainlit/react-client
```

This package use [Recoil](https://github.com/facebookexperimental/Recoil) to manage its state. This means you will have to wrap your application in a recoil provider:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';

import { ChainlitAPI, ChainlitContext } from '@chainlit/react-client';

const CHAINLIT_SERVER_URL = 'http://localhost:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL, 'webapp');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <MyApp />
      </RecoilRoot>
    </ChainlitContext.Provider>
  </React.StrictMode>
);
```

## Usage

### `useChatSession`

This hook is responsible for managing the chat session's connection to the WebSocket server.

#### Methods

- `connect`: Establishes a connection to the WebSocket server.
- `disconnect`: Disconnects from the WebSocket server.
- `setChatProfile`: Sets the chat profile state.

#### Example

```jsx
import { useChatSession } from '@chainlit/react-client';

const ChatComponent = () => {
  const { connect, disconnect, chatProfile, setChatProfile } = useChatSession();

  // Connect to the WebSocket server
  useEffect(() => {
    connect({
      userEnv: {
        /* user environment variables */
      }
    });

    return () => {
      disconnect();
    };
  }, []);

  // Rest of your component logic
};
```

### `useChatMessages`

This hook provides access to the chat messages and the first user message.

#### Properties

- `messages`: An array of chat messages.
- `firstUserMessage`: The first message from the user.

#### Example

```jsx
import { useChatMessages } from '@chainlit/react-client';

const MessagesComponent = () => {
  const { messages, firstUserMessage } = useChatMessages();

  // Render your messages
  return (
    <div>
      {messages.map((message) => (
        <p key={message.id}>{message.output}</p>
      ))}
    </div>
  );
};
```

### `useChatData`

This hook provides access to various chat-related data and states.

#### Properties

- `actions`: An array of actions.
- `askUser`: The current ask user state.
- `avatars`: An array of avatar elements.
- `chatSettingsDefaultValue`: The default value for chat settings.
- `chatSettingsInputs`: The current chat settings inputs.
- `chatSettingsValue`: The current value of chat settings.
- `connected`: A boolean indicating if the WebSocket connection is established.
- `disabled`: A boolean indicating if the chat is disabled.
- `elements`: An array of chat elements.
- `error`: A boolean indicating if there is an error in the session.
- `loading`: A boolean indicating if the chat is in a loading state.
- `tasklists`: An array of tasklist elements.

#### Example

```jsx
import { useChatData } from '@chainlit/react-client';

const ChatDataComponent = () => {
  const { loading, connected, error } = useChatData();

  // Use the data to render your component
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error connecting to chat...</p>;
  if (!connected) return <p>Disconnected...</p>;

  // Rest of your component logic
};
```

### `useChatInteract`

This hook provides methods to interact with the chat, such as sending messages, replying, and updating settings.

#### Methods

- `callAction`: Calls an action.
- `clear`: Clears the chat session.
- `replyMessage`: Replies to a message.
- `sendMessage`: Sends a message.
- `stopTask`: Stops the current task.
- `setIdToResume`: Sets the ID to resume a thread.
- `updateChatSettings`: Updates the chat settings.

#### Example

```jsx
import { useChatInteract } from '@chainlit/react-client';

const InteractionComponent = () => {
  const { sendMessage, replyMessage } = useChatInteract();

  const handleSendMessage = () => {
    const message = { output: 'Hello, World!', id: 'message-id' };
    sendMessage(message);
  };

  const handleReplyMessage = () => {
    const message = { output: 'Replying to your message', id: 'reply-id' };
    replyMessage(message);
  };

  // Render your interaction component
  return (
    <div>
      <button onClick={handleSendMessage}>Send Message</button>
      <button onClick={handleReplyMessage}>Reply to Message</button>
    </div>
  );
};
```
