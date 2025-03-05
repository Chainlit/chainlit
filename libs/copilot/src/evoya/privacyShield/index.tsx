import { useChatInteract } from '@chainlit/react-client';

import { usePrivacyShield } from "./usePrivacyShield";
import TextSections from "./TextSections";

import { Translator } from "@chainlit/app/src/components/i18n";
import { Button } from "@chainlit/app/src/components/ui/button";
import { Card } from "@chainlit/app/src/components/ui/card";

import { Lock, Send, LoaderCircle  } from "lucide-react";

interface Props {
  submit: (text: string) => void;
}

const PrivacyShieldOverlay = ({ submit }: Props): JSX.Element => {
  const { open, loading, setOpen, anonText, lockSections, resetSections } =
    usePrivacyShield();

  if (!open) {
    return <></>;
  }

  const cancelAction = () => {
    resetSections();
    setOpen(false);
  };

  const submitAction = () => {
    submit(anonText);
    setOpen(false);
    lockSections();
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex p-4 z-10">
      <Card className="w-full mx-auto bg-muted rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 flex items-center border-b">
          <Lock className="w-5 h-5" />
          <span className="ml-2 font-bold">Privacy Shield</span>
        </div>
        <div className={`flex-grow bg-background overflow-hidden flex items-center ${loading ? 'justify-center' : 'justify-between'}  p-4`}>
          {loading ? <LoaderCircle className="animate-spin text-primary" /> : <TextSections />}
        </div>
        <div className="p-4 flex justify-end gap-2 border-t">
          <Button variant="outline" onClick={cancelAction}>
            <Translator path="components.organisms.privacyShield.actions.cancel" />
          </Button>
          <Button onClick={submitAction}>
            <Translator path="components.organisms.privacyShield.actions.submit" />
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyShieldOverlay;