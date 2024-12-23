import { memo } from 'react';
import { useRecoilValue } from 'recoil';

import { useAudio, useConfig } from '@chainlit/react-client';

import { settingsState } from 'state/settings';
import { ThemeToggle } from './ThemeToggle';
import ApiKeys from './ApiKeys';
import NewChatButton from './NewChat';
import AudioPresence from '@/components/AudioPresence';
import UserNav from './UserNav';
import SidebarTrigger from './SidebarTrigger';
import ChatProfiles from './ChatProfiles';
import { useSidebar } from '@/components/ui/sidebar';
import ReadmeButton from './Readme';


const Header = memo(() => {
  const { audioConnection } = useAudio();
  const {config} = useConfig()
  const {open, openMobile, isMobile} = useSidebar()

  const sidebarOpen = isMobile ? openMobile : open

  const show = config?.dataPersistence && sidebarOpen

  return (
    <div className='p-3 flex h-[60px] items-center justify-between gap-2 relative' id="header">
            <div className='flex items-center'>

                {show ? null : config?.dataPersistence? <SidebarTrigger /> : null}
                {show ? null : <NewChatButton />}

                <ChatProfiles />
                </div>

      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>


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
      <div className='flex items-center gap-1'>
        <ReadmeButton />
        <ApiKeys />
        <ThemeToggle />
        <UserNav />
      </div>
    </div>
  );
});

export { Header };
