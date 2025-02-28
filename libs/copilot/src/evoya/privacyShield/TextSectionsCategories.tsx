import { Translator } from "@chainlit/app/src/components/i18n";
import { Button } from "@chainlit/app/src/components/ui/button";
import { Card } from "@chainlit/app/src/components/ui/card";
import { Badge } from "@chainlit/app/src/components/ui/badge";

import { usePrivacyShield } from "./usePrivacyShield";

import { TextSection } from "./types";
import { Plus, X, Pencil } from "lucide-react";


interface Props {
  setActiveSection: (id: string) => void;
  setEditSection: (value: string) => void;
  createSectionAction: () => void;
  editSectionAction: (section: TextSection) => void;
  activeSection: string;
}

const TextSectionsCategories = ({ setActiveSection, createSectionAction, editSectionAction, activeSection, setEditSection }: Props): JSX.Element => {
  const { setSectionAnon, categories, removeSection } = usePrivacyShield();

  return (
    <Card className="w-full max-h-full overflow-hidden flex flex-col shadow-md">
      <div className="overflow-auto p-4 flex flex-col flex-grow">
        {Object.keys(categories).map((categoryKey, index) => (
          <div key={categoryKey} className={index > 0 ? "mt-4" : ""}>
            <div className="text-primary border-b border-gray-300 font-bold pb-2">
              {categoryKey.toUpperCase()}
            </div>

            <div className="space-y-2">
              {categories[categoryKey].map((section) => (
                <div
                  key={section.id}
                  className={`p-2 grid grid-cols-[auto_auto_72px] items-center border-b border-gray-300 ${activeSection === section.id ? "bg-gray-100" : "bg-transparent"
                    }`}
                  onMouseEnter={() => setActiveSection(section.id)}
                  onMouseLeave={() => setActiveSection("")}
                >
                  <div
                    className="cursor-pointer"
                    onClick={!section.isLocked ? () => setSectionAnon(section.id, true) : undefined}
                  >
                    {section.isAnon ? (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        {section.anonString}
                      </Badge>
                    ) : (
                      section.anonString
                    )}
                  </div>

                  {/* Original Text */}
                  <div
                    className="cursor-pointer"
                    onClick={!section.isLocked ? () => setSectionAnon(section.id, false) : undefined}
                  >
                    {!section.isAnon ? (
                      <Badge variant="outline" className="text-red-500 border-red-500">
                        {section.string}
                      </Badge>
                    ) : (
                      section.string
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!section.isLocked && (
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => editSectionAction(section)} className="text-gray-600 hover:text-gray-900">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removeSection(section.id)} className="text-red-600 hover:text-red-900">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4">
        <Button variant="outline" className="flex items-center gap-2 text-primary" onClick={() => { createSectionAction(); setEditSection(null); }}>
          <Plus className="w-4 h-4" />
          <Translator path="components.organisms.privacyShield.actions.createSection" />
        </Button>
      </div>
    </Card>
  );
};

export default TextSectionsCategories;
