import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAudio, useAuth, useConfig } from '@chainlit/react-client';

import AudioPresence from '@/components/AudioPresence';
import ButtonLink from '@/components/ButtonLink';
import { useSidebar } from '@/components/ui/sidebar';

import ApiKeys from './ApiKeys';
import ChatProfiles from './ChatProfiles';
import NewChatButton from './NewChat';
import ReadmeButton from './Readme';
import SidebarTrigger from './SidebarTrigger';
import { ThemeToggle } from './ThemeToggle';
import UserNav from './UserNav';

const Header = memo(() => {
  const { audioConnection } = useAudio();
  const navigate = useNavigate();
  const { data } = useAuth();
  const { config } = useConfig();
  const { open, openMobile, isMobile } = useSidebar();

  const sidebarOpen = isMobile ? openMobile : open;

  const historyEnabled = data?.requireLogin && config?.dataPersistence;

  const links = config?.ui?.header_links || [];

  return (
    <div
      className="p-3 flex h-[60px] items-center justify-between gap-2 relative"
      id="header"
    >
      <div className="flex items-center">
        {historyEnabled ? !sidebarOpen ? <SidebarTrigger /> : null : null}
        {historyEnabled ? (
          !sidebarOpen ? (
            <NewChatButton navigate={navigate} />
          ) : null
        ) : (
          <NewChatButton navigate={navigate} />
        )}

        <ChatProfiles navigate={navigate} />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {audioConnection === 'on' ? (
          <AudioPresence
            type="server"
            height={35}
            width={70}
            barCount={4}
            barSpacing={2}
          />
        ) : null}
      </div>

      <div />
      <div className="flex items-center gap-1">
        <ReadmeButton />
        <ApiKeys />
        {links &&
          links.map((link, index) => (
            <ButtonLink
              key={`${link.name}-${link.url}-${index}`}
              name={link.name}
              displayName={link.display_name}
              iconUrl={link.icon_url}
              url={link.url}
            />
          ))}
        <ThemeToggle />
        <UserNav />
      </div>
    </div>
  );
});

export { Header };
