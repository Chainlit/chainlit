import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePrivacyShield } from "./usePrivacyShield";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@chainlit/app/src/components/ui/tooltip";

import { LockIcon } from "lucide-react";

interface Props {
  sectionId: string;
}

const ResponseTextItem = ({ sectionId }: Props): JSX.Element => {
  const { categories, enabledVisual } = usePrivacyShield();
  const { t } = useTranslation();

  const sectionItem = useMemo(
    () => Object.values(categories).flatMap((cat) => cat).find((sec) => sec.id === sectionId),
    [categories, sectionId]
  );

  if (!sectionItem?.isAnon) {
    return (
      <div className="inline cursor-help text-red-500">
        <TooltipProvider delayDuration={100}>
          <Tooltip>

            <TooltipTrigger asChild>
              <span>{sectionItem?.string ?? ""}</span>
            </TooltipTrigger>
            <TooltipContent>{t("components.organisms.privacyShield.word.notAnon")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  return (
    <div className={`inline-block cursor-help ${sectionItem?.isAnon ? "text-green-500" : "text-red-500"}`}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1">
              {enabledVisual ? sectionItem?.string : sectionItem.anonString}
              {enabledVisual && <LockIcon className="w-4 h-4" />}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {enabledVisual ? t("components.organisms.privacyShield.word.anon") : sectionItem.string}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    </div>
  );
};

export default ResponseTextItem;
