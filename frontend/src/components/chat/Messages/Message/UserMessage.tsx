import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import {
  IStep,
  messagesState,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';

import AutoResizeTextarea from '@/components/AutoResizeTextarea';
import { Pencil } from '@/components/icons/Pencil';
import { Button } from '@/components/ui/button';
import { Translator } from 'components/i18n';

interface Props {
  message: IStep;
}

export default function UserMessage({
  message,
  children
}: React.PropsWithChildren<Props>) {
  const config = useConfig();
  const { askUser, loading } = useContext(MessageContext);
  const { editMessage } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const disabled = loading || !!askUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const isEditable = !!config.config?.features.edit_message;

  const handleEdit = () => {
    if (editValue) {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        if (index === -1) {
          return prev;
        }
        const slice = prev.slice(0, index + 1);
        slice[index].steps = [];
        return slice;
      });
      setIsEditing(false);
      editMessage({ ...message, output: editValue });
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center gap-1 w-full group">
        {!isEditing && isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="edit-message ml-auto invisible group-hover:visible"
            onClick={() => {
              setEditValue(message.output);
              setIsEditing(true);
            }}
            disabled={disabled}
          >
            <Pencil />
          </Button>
        )}
        <div
          className={`px-5 py-2.5 relative bg-accent rounded-3xl
            ${isEditing ? 'w-full' : 'max-w-[70%]'}
            ${isEditing ? 'flex-grow' : 'flex-grow-0'}
            ${isEditable ? '' : 'ml-auto'}`}
        >
          {isEditing ? (
            <div className="bg-accent rounded-3xl flex flex-col">
              <AutoResizeTextarea
                id="edit-chat-input"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-1 bg-transparent placeholder:text-base placeholder:font-medium text-base"
                maxHeight={250}
              />
              <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <Translator path="common.actions.cancel" />
                </Button>
                <Button
                  className="confirm-edit"
                  disabled={disabled}
                  onClick={handleEdit}
                >
                  <Translator path="common.actions.confirm" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {message.command ? (
                <div className="font-bold text-[#08f] command-span">
                  {message.command}
                </div>
              ) : null}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
