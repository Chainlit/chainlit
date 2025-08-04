import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { useContext, useMemo, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import {
  IMessageElement,
  IStep,
  messagesState,
  useChatInteract
} from '@chainlit/react-client';

import AutoResizeTextarea from '@/components/AutoResizeTextarea';
import { Pencil } from '@/components/icons/Pencil';
import { Button } from '@/components/ui/button';
import { Translator } from 'components/i18n';

import { InlinedElements } from './Content/InlinedElements';

interface Props {
  message: IStep;
  elements: IMessageElement[];
}

export default function UserMessage({
  message,
  elements,
  children
}: React.PropsWithChildren<Props>) {
  const { askUser, loading, editable } = useContext(MessageContext);
  const { editMessage } = useChatInteract();
  const setMessages = useSetRecoilState(messagesState);
  const disabled = loading || !!askUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const inlineElements = useMemo(() => {
    return elements.filter(
      (el) => el.forId === message.id && el.display === 'inline'
    );
  }, [message.id, elements]);

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
    <div className="flex flex-col w-full gap-1">
      <InlinedElements elements={inlineElements} className="items-end" />

      <div className="flex flex-row items-center gap-1 w-full group">
        {!isEditing && editable && (
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
          className={cn(
            'px-5 py-2.5 relative bg-accent rounded-3xl',
            inlineElements.length ? 'rounded-tr-lg' : '',
            isEditing ? 'w-full flex-grow' : 'max-w-[70%] flex-grow-0',
            editable ? '' : 'ml-auto'
          )}
        >
          {isEditing ? (
            <div className="bg-accent flex flex-col">
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
