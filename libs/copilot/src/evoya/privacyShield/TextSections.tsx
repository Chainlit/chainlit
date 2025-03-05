import { useEffect, useState, useRef } from "react";

import { Button } from "@chainlit/app/src/components/ui/button";
import { Card } from "@chainlit/app/src/components/ui/card";
import { Translator } from "@chainlit/app/src/components/i18n";

import { usePrivacyShield } from "./usePrivacyShield";

import { TextSection } from "./types";
import TextSectionsItem from "./TextSectionsItem";
import CreateSection from "./CreateSection";
import TextSectionsCategories from "./TextSectionsCategories";

import { Plus } from "lucide-react"; // Using Lucide icons as ShadCN doesn't have built-in icons

const TextSections = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [editSection, setEditSection] = useState<TextSection | null>(null);
  const [textSelection, setTextSelection] = useState<string>("");
  const [showCreateSection, setShowCreateSection] = useState<{ x: number; y: number } | null>(null);
  const [showCreateSectionPopup, setShowCreateSectionPopup] = useState<boolean>(false);
  const textContainer = useRef<HTMLDivElement>(null);

  const { toggleSectionAnon, editSectionType, addSection, textSections } = usePrivacyShield();

  const textSelected = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      if (textContainer.current) {
        const containerBound = textContainer.current.getBoundingClientRect();
        const menuPosY = event.clientY - containerBound.y - 60;
        setShowCreateSection({
          x: event.clientX - containerBound.x,
          y: menuPosY < 0 ? event.clientY - containerBound.y : menuPosY,
        });
        setTextSelection(selection.toString());
      } else {
        setShowCreateSection(null);
      }
    }
  };

  const textUnselected = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setShowCreateSection(null);
    }
  };

  const createPrivacySection = (type: string, text: string | null) => {
    if (editSection) {
      editSectionType(editSection.id ?? "", type);
    } else {
      addSection({
        id: `ps-${Date.now()}`,
        string: (text ?? textSelection).trim(),
        type,
        isAnon: true,
        isLocked: false,
      });
    }
    setShowCreateSectionPopup(false);
    setEditSection(null);
    setTextSelection("");
  };

  const createSectionAction = () => {
    setShowCreateSectionPopup(true)
  };

  const dialogClosed = () => {
    setTextSelection("");
    setEditSection(null);
  };
  
  const closeDialog = () => {
    setShowCreateSectionPopup(false)
    dialogClosed()
  };

  const editSectionAction = (section: TextSection) => {
    setEditSection(section);
    setShowCreateSectionPopup(true);
  };

  useEffect(() => {
    document.addEventListener("mousedown", textUnselected);
    return () => document.removeEventListener("mousedown", textUnselected);
  }, []);

  return (
    <div className="grid grid-cols-3 h-full w-full">
      <CreateSection
        open={showCreateSectionPopup}
        closeDialog={closeDialog}
        dialogClosed={dialogClosed}
        createSection={createPrivacySection}
        showTextField={!textSelection && !editSection}
        editSection={editSection}
        textSelection={textSelection}
      />

      <div className="col-span-2 p-2 relative">
        {showCreateSection && (
          <Card
            className="absolute bg-background shadow-lg p-2 rounded z-10"
            style={{ top: showCreateSection.y, left: showCreateSection.x }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button variant="outline" className="flex items-center gap-2 text-primary" onClick={createSectionAction}>
              <Plus className="w-4 h-4" />
              <Translator path="components.organisms.privacyShield.actions.createSection" />
            </Button>
          </Card>
        )}

        <div onMouseUp={textSelected} ref={textContainer} className='block'>
          {textSections.map((section) =>
            section.id ? (
              <TextSectionsItem
                key={section.id}
                section={section}
                isActive={section.id === activeSection}
                setActive={(id) => setActiveSection(id)}
                toggleAnon={toggleSectionAnon}
                setEdit={editSectionAction}
              />
            ) : (
              <span key={section.string} className="whitespace-pre-wrap">
                {section.string}
              </span>
            )
          )}
        </div>
      </div>

      <div className="p-2 overflow-hidden">
        <TextSectionsCategories
          setActiveSection={setActiveSection}
          createSectionAction={createSectionAction}
          editSectionAction={editSectionAction}
          setEditSection={setEditSection}
          activeSection={activeSection}
        />
      </div>
    </div>
  );
};

export default TextSections;
