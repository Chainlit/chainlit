import { useState } from "react";

import { useMediaQuery } from "react-responsive";
import { usePrivacyShield } from "./usePrivacyShield";

import { Label } from "@chainlit/app/src/components/ui/label";
import { Switch } from "@chainlit/app/src/components/ui/switch";
import { Translator } from "@chainlit/app/src/components/i18n";
import { Button } from "@chainlit/app/src/components/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@chainlit/app/src/components/ui/dropdown-menu";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@chainlit/app/src/components/ui/tooltip";

import { Lock, LockOpen, Eye, EyeOff } from "lucide-react";

const PrivacyShieldToggle = (): JSX.Element => {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    enabled,
    setEnabled,
    enabledVisual,
    setEnabledVisual,
    sections,
  } = usePrivacyShield();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1199px)' })

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipContent className='w-[350px]'>
            <Translator path="components.organisms.privacyShield.info" />
          </TooltipContent>
          <TooltipTrigger asChild>
            {isTabletOrMobile ?
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {enabled ? <Lock className="h-5 w-5 text-primary" /> : <LockOpen className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white p-2 w-56 rounded-md shadow-md">
                  <DropdownMenuLabel>Privacy & View Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-gray-500' />
                  {/* Privacy Shield Toggle */}
                  <DropdownMenuCheckboxItem
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  >
                    Privacy Shield
                  </DropdownMenuCheckboxItem>

                  {/* View Toggle */}
                  <DropdownMenuCheckboxItem
                    checked={enabledVisual}
                    onCheckedChange={() => setEnabledVisual(!enabledVisual)}
                    disabled={sections.length === 0}
                  >
                    View
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              :
              (
                <div className="flex items-center space-x-2">
                  {enabled ? <Lock className="h-5 w-5 text-primary" /> : <LockOpen className="h-5 w-5" />}
                  <Switch
                    checked={enabled ?? false}
                    onCheckedChange={(e) => setEnabled(e)}
                    name="privacy_shield"
                  />
                  <Label htmlFor="privacy_shield">Privacy Shield</Label>
                </div>

              )
            }
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipContent>
            {
              enabledVisual ? (
                <Translator path="components.organisms.privacyShield.hidePrivacyTable" />
              ) : (
                <Translator path="components.organisms.privacyShield.showPrivacyTable" />
              )
            }
          </TooltipContent>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setEnabledVisual(!enabledVisual)} disabled={sections.length === 0}>
              {enabledVisual ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

    </div>
  );
};

export default PrivacyShieldToggle;
