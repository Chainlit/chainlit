import Chat from 'chat';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import { WidgetContext } from './context';
import { cn } from '@/lib/utils';
import { firstUserInteraction, evoyaCreatorEnabledState } from '@chainlit/react-client';


export default function WidgetEmbedded() {
  const { evoya } = useContext(WidgetContext)
  const [expanded, setExpanded] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);
  const setCreatorEnabled = useSetRecoilState(evoyaCreatorEnabledState);

  const viewportHandler = () => {
    if (window.visualViewport) {
      setVisualViewportHeight(window.visualViewport.height);
      setVisualViewportOffsetTop(window.visualViewport.offsetTop);
    }
  };

  useEffect(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", viewportHandler);
      window.visualViewport.addEventListener("scroll", viewportHandler);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", viewportHandler);
        window.visualViewport.removeEventListener("scroll", viewportHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (evoya?.type === 'dashboard') {
      window.addEventListener('disable-creator-mode', () => {
        setCreatorEnabled(false);
      });
      window.addEventListener('enable-creator-mode', () => {
        console.log("enable creator");
        setCreatorEnabled(true);
      });
    }
    return () => {
    }
  }, []);

  useEffect(() => {
    window.toggleChainlitCopilot = () => setExpanded((prev) => !prev);

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
    };
  }, []);

  return (
    <div className={cn("flex flex-col rounded-xl bg-background h-full w-full relative shadow-lg ", 
      expanded
      ? 'copilot-container-expanded'
      : 'copilot-container-collapsed')}>
      <div className='h-[calc(100%-75px)]'>
        {
          !evoya?.headerConfig?.hideHeaderBar && (
            <Header expanded={expanded} setExpanded={setExpanded} />
          )
        }
        <Chat />
      </div>
    </div>
  );
}