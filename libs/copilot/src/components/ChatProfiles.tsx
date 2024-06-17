import size from 'lodash/size';
import { useContext, useState } from 'react';

import { SelectInput } from '@chainlit/app/src/components/atoms/inputs';
import NewChatDialog from '@chainlit/app/src/components/molecules/newChatDialog';
import {
  ChainlitContext,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

export default function ChatProfiles() {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile, setChatProfile } = useChatSession();
  const { firstInteraction } = useChatMessages();
  const { clear } = useChatInteract();
  const [newChatProfile, setNewChatProfile] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleClose = () => {
    setOpenDialog(false);
    setNewChatProfile(null);
  };

  const handleConfirm = (newChatProfileWithoutConfirm?: string) => {
    const chatProfile = newChatProfileWithoutConfirm || newChatProfile;
    if (!chatProfile) {
      // Should never happen
      throw new Error('Retry clicking on a profile before starting a new chat');
    }
    setChatProfile(chatProfile);
    setNewChatProfile(null);
    clear();
    handleClose();
  };

  if (!chatProfile && size(config?.chatProfiles) > 0) {
    setChatProfile(config?.chatProfiles[0].name);
  }

  if (typeof config === 'undefined' || config.chatProfiles.length <= 1) {
    return null;
  }

  const items = config.chatProfiles.map((item) => {
    const icon = item.icon?.includes('/public')
      ? apiClient.buildEndpoint(item.icon)
      : item.icon;
    return {
      label: item.name,
      value: item.name,
      icon: icon ? (
        <img
          src={icon}
          className="chat-profile-icon"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : undefined
    };
  });

  return (
    <>
      <SelectInput
        value={chatProfile || ''}
        items={items}
        id="chat-profile-selector"
        onChange={(e) => {
          const newValue = e.target.value;
          setNewChatProfile(newValue);
          if (firstInteraction) {
            setOpenDialog(true);
          } else {
            handleConfirm(newValue);
          }
        }}
      />
      <NewChatDialog
        open={openDialog}
        handleClose={handleClose}
        handleConfirm={() => handleConfirm()}
      />
    </>
  );
}
