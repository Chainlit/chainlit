import { useTranslation } from "react-i18next";
import AutoResizeTextarea from "../../AutoResizeTextarea";
import { useCallback, useState } from "react";
import UploadButton from "./UploadButton";
import { IAttachment, attachmentsState } from 'state/chat';
import { FileSpec, IStep, useChatInteract, useAuth, useChatData } from '@chainlit/react-client';
import { v4 as uuidv4 } from 'uuid';
import { useRecoilState, useSetRecoilState } from "recoil";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { chatSettingsOpenState } from "@/state/project";
import VoiceButton from "./VoiceButton";
import SubmitButton from "./SubmitButton";
import { Attachments } from "./Attachments";

interface Props {
    fileSpec: FileSpec;
    onFileUpload: (payload: File[]) => void;
    onFileUploadError: (error: string) => void;
    setAutoScroll: (autoScroll: boolean) => void;
    autoScroll?: boolean;
  }

export default function MessageComposer({fileSpec, onFileUpload, onFileUploadError, setAutoScroll, autoScroll}: Props) {
    const [value, setValue] = useState("")
    const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
    const [attachments, setAttachments] = useRecoilState(attachmentsState);
    const {t} = useTranslation()

    const { user } = useAuth();
    const { sendMessage, replyMessage } = useChatInteract();
    const {
        askUser,
        chatSettingsInputs,
        disabled: _disabled
      } = useChatData();

      const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

    const onSubmit = useCallback(
      async (msg: string, attachments?: IAttachment[]) => {
        const message: IStep = {
          threadId: '',
          id: uuidv4(),
          name: user?.identifier || 'User',
          type: 'user_message',
          output: msg,
          createdAt: new Date().toISOString()
        };

        const fileReferences = attachments
          ?.filter((a) => !!a.serverId)
          .map((a) => ({ id: a.serverId! }));

        setAutoScroll(true);
        sendMessage(message, fileReferences);
      },
      [user, sendMessage]
    );

    const onReply = useCallback(
      async (msg: string) => {
        const message: IStep = {
          threadId: '',
          id: uuidv4(),
          name: user?.identifier || 'User',
          type: 'user_message',
          output: msg,
          createdAt: new Date().toISOString()
        };

        replyMessage(message);
        setAutoScroll(true);
      },
      [user, replyMessage]
    );

    const submit = useCallback(() => {
        if (disabled || (value === '' && attachments.length === 0)) {
          return;
        }
        if (askUser) {
          onReply(value);
        } else {
          onSubmit(value, attachments);
        }
        setAttachments([]);
        setValue('');
      }, [
        value,
        disabled,
        setValue,
        askUser,
        attachments,
        setAttachments,
        onSubmit
      ]);

    return <div className="bg-accent rounded-3xl p-3 px-4 w-full min-h-24 flex flex-col">
                {attachments.length > 0 ? (
          <div
          className="mb-1"
          >
            <Attachments />
          </div>
        ) : null}
        <AutoResizeTextarea value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 bg-transparent placeholder:text-base placeholder:font-medium text-base"    maxHeight={250}      placeholder={t(
            'components.organisms.chat.inputBox.input.placeholder'
          )} />
          <div className="flex items-center justify-between">
            <div className="flex items-center -ml-1.5">
                <UploadButton 
                          disabled={disabled}
                          fileSpec={fileSpec}
                          onFileUploadError={onFileUploadError}
                          onFileUpload={onFileUpload}
                />
                                    <VoiceButton />

                            {chatSettingsInputs.length > 0 && (
                <Button
                  id="chat-settings-open-modal"
                  disabled={disabled}
                  onClick={() => setChatSettingsOpen(true)}
                  className="hover:bg-muted"
                  variant="ghost"
                  size="icon"
                >
                  <Settings className="!size-5" />

                </Button>
              )}
            </div>
            <div>
                <SubmitButton onSubmit={submit} disabled={disabled || !value} />
            </div>
          </div>
    </div>
}