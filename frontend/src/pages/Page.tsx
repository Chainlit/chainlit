import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useConfig, sideViewState, useAuth } from '@chainlit/react-client';
import { ElementSideView } from 'components/atoms/elements';
import { userEnvState } from 'state/user';
import { Header } from '@/components/header';
import LeftSidebar from '@/components/LeftSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TaskList } from '@/components/Tasklist';

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

  const content = <div className="flex flex-col flex-grow">

    <div className="flex flex-row h-full w-full">
      <div className="flex flex-col flex-grow">
        <Header />
        <div className="flex flex-row flex-grow overflow-auto">
          {children}
        </div>
      </div>
      {sideViewElement ? null : <TaskList isMobile={false} />}
      <ElementSideView />
    </div>
</div>

  return (
    <SidebarProvider>
    {config?.dataPersistence && data?.requireLogin ?
    <>
      <LeftSidebar />
      <SidebarInset>
    {content}
    </SidebarInset>
    </>
        : <div className='h-screen w-screen flex'>{content}</div>
    }
     </SidebarProvider> 
  );
};

export default Page;