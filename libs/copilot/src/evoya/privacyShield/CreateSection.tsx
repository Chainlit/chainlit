import { useEffect, useState } from "react";

import { Translator } from "@chainlit/app/src/components/i18n";
import { Button } from "@chainlit/app/src/components/ui/button";
import { Card } from "@chainlit/app/src/components/ui/card";
import { Input } from "@chainlit/app/src/components/ui/input";
import { Label } from "@chainlit/app/src/components/ui/label";
import { TextSection } from "./types";
import { Select } from "../ShareSessionButton";

type Props = {
  textSelection: string;
  editSection: TextSection | null;
  open: boolean;
  showTextField: boolean;
  closeDialog: () => void;
  dialogClosed: () => void;
  createSection: (type: string, text: string | null) => void;
};

const CreateSection = ({
  open,
  closeDialog,
  dialogClosed,
  createSection,
  showTextField,
  editSection,
  textSelection,
}: Props) => {
  const [sectionType, setSectionType] = useState<string>(editSection?.type ?? "other");
  const [sectionText, setSectionText] = useState<string>("");

  const options = [
    { 
      value: "name", 
      label: <Translator path="components.organisms.privacyShield.createSection.typefield.options.name" />
    },
    { 
      value: "location", 
      label: <Translator path="components.organisms.privacyShield.createSection.typefield.options.location" />
    },
    { 
      value: "phone", 
      label: <Translator path="components.organisms.privacyShield.createSection.typefield.options.phone" />
    },
    { 
      value: "email", 
      label: <Translator path="components.organisms.privacyShield.createSection.typefield.options.email" />
    },
    { 
      value: "other", 
      label: <Translator path="components.organisms.privacyShield.createSection.typefield.options.other" />
    }
  ];

  useEffect(() => {
    if (editSection && editSection.type) {
      setSectionType(editSection.type);
    }
  }, [editSection]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-[999]">
      <Card className="w-full max-w-md bg-background p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {editSection ? (
            <Translator path="components.organisms.privacyShield.createSection.title.edit" />
          ) : (
            <Translator path="components.organisms.privacyShield.createSection.title.create" />
          )}
        </h2>
        <div className="space-y-4">
          <Label htmlFor="privacy-text">Text</Label>
          {showTextField ? (
            <Input
              id="privacy-text"
              label="Text"
              variant="outlined"
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
            />
          ) : (
            <Input
              id="privacy-text"
              label="Text"
              variant="outlined"
              value={editSection ? editSection.string : textSelection}
              sx={{ width: '100%', marginBottom: 4 }}
              disabled
            />
          )}
          <Select
            value={sectionType}
            onChange={(e) => setSectionType(e.target.value)}
            options={options}
            label={'Type'}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={closeDialog}>
            <Translator path="components.organisms.privacyShield.createSection.actions.close" />
          </Button>
          <Button onClick={() => { createSection(sectionType, showTextField ? sectionText : null); setSectionText('') }}>
            {editSection ? (
              <Translator path="components.organisms.privacyShield.createSection.actions.save" />
            ) : (
              <Translator path="components.organisms.privacyShield.createSection.actions.create" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateSection;
