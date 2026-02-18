import { ChevronsRight, Maximize, Minimize, PanelRight } from 'lucide-react';

import AudioPresence from '@chainlit/app/src/components/AudioPresence';
import { Logo } from '@chainlit/app/src/components/Logo';
import ChatProfiles from '@chainlit/app/src/components/header/ChatProfiles';
import NewChatButton from '@chainlit/app/src/components/header/NewChat';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { IChainlitConfig, useAudio } from '@chainlit/react-client';

import { useCopilotInteract } from '../hooks';
import { DisplayMode } from '../types';

interface IProjectConfig {
  config?: IChainlitConfig;
  error?: Error;
  isLoading: boolean;
  language: string;
}

interface Props {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  projectConfig: IProjectConfig;
  displayMode?: DisplayMode;
  setDisplayMode?: (mode: DisplayMode) => void;
  setIsOpen?: (open: boolean) => void;
}

const Header = ({
  expanded,
  setExpanded,
  projectConfig,
  displayMode,
  setDisplayMode,
  setIsOpen
}: Props): JSX.Element => {
  const { config } = projectConfig;
  const { audioConnection } = useAudio();
  const { startNewChat } = useCopilotInteract();
  const { t } = useTranslation();

  const hasChatProfiles = !!config?.chatProfiles.length;

  return (
    <div className="flex align-center justify-between p-4 pb-0">
      <div className="flex items-center gap-1">
        {hasChatProfiles ? <ChatProfiles /> : <Logo className="w-[100px]" />}
      </div>
      <div className="flex items-center">
        {audioConnection === 'on' ? (
          <AudioPresence
            type="server"
            height={20}
            width={40}
            barCount={4}
            barSpacing={2}
          />
        ) : null}
        <NewChatButton
          className="text-muted-foreground mt-[1.5px]"
          onConfirm={startNewChat}
        />
        {setDisplayMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="display-mode-button" size="icon" variant="ghost">
                <PanelRight className="!size-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              container={window.cl_shadowRootElement}
            >
              <DropdownMenuRadioGroup
                value={displayMode}
                onValueChange={(v) => setDisplayMode(v as DisplayMode)}
              >
                <DropdownMenuRadioItem value="floating">
                  {t('copilot.displayMode.floating')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sidebar">
                  {t('copilot.displayMode.sidebar')}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {displayMode === 'sidebar' && setIsOpen ? (
          <Button
            id="close-sidebar-button"
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            <ChevronsRight className="!size-5 text-muted-foreground" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <Minimize className="!size-5 text-muted-foreground" />
            ) : (
              <Maximize className="!size-5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
