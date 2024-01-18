import size from 'lodash/size';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import NewChatDialog from '@chainlit/app/src/components/molecules/newChatDialog';
import { projectSettingsState } from '@chainlit/app/src/state/project';
import {
  useChatInteract,
  useChatMessages,
  useChatSession
} from '@chainlit/react-client';
import { SelectInput } from '@chainlit/react-components';

export default function ChatProfiles() {
  const pSettings = useRecoilValue(projectSettingsState);
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

  if (!chatProfile && size(pSettings?.chatProfiles) > 0) {
    setChatProfile(pSettings?.chatProfiles[0].name);
  }

  if (typeof pSettings === 'undefined' || pSettings.chatProfiles.length <= 1) {
    return null;
  }

  const items = pSettings.chatProfiles.map((item) => ({
    label: item.name,
    value: item.name,
    icon: item.icon ? (
      <img
        src={item.icon}
        className="chat-profile-icon"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    ) : undefined
  }));

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
