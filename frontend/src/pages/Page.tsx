import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useConfig, sideViewState, useAuth } from '@chainlit/react-client';
import { userEnvState } from 'state/user';
import { Header } from '@/components/header';
import LeftSidebar from '@/components/LeftSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TaskList } from '@/components/Tasklist';
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import ElementSideView from '@/components/ElementSideView';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { config } = useConfig();
  const {data} = useAuth()
  const userEnv = useRecoilValue(userEnvState);
  const sideViewElement = useRecoilValue(sideViewState);

  if(!config) return null

  if (config?.userEnv) {
    for (const key of config.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  const content = <ResizablePanelGroup
      direction="horizontal"
      className="flex flex-row h-full w-full"
    >
            <ResizablePanel className='flex flex-col h-full w-full' minSize={60} defaultSize={50}>

        <Header />
        <div className="flex flex-row flex-grow overflow-auto">
          {children}
        </div>
      </ResizablePanel>
      {sideViewElement ? <ElementSideView />
 : <TaskList isMobile={false} />}
    </ResizablePanelGroup>

const historyEnabled = config?.dataPersistence && data?.requireLogin

  return (
    <SidebarProvider>
    { historyEnabled ?
    <>
      <LeftSidebar />
      <SidebarInset className='max-h-svh'>
    {content}
    </SidebarInset>
    </>
        : <div className='h-screen w-screen flex'>{content}</div>
    }
     </SidebarProvider> 
  );
};

export default Page;