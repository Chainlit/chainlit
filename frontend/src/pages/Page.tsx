import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useAuth, useConfig, sideViewState } from '@chainlit/react-client';
import { ElementSideView } from 'components/atoms/elements';
import { Translator } from 'components/i18n';
import { TaskList } from 'components/molecules/tasklist/TaskList';
import { userEnvState } from 'state/user';
import { Header } from '@/components/header';
import Alert from '@/components/Alert';
import LeftSidebar from '@/components/LeftSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Loader } from '@/components/Loader';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  const { config } = useConfig();
  const userEnv = useRecoilValue(userEnvState);
  const sideViewElement = useRecoilValue(sideViewState);

  if (config?.userEnv) {
    for (const key of config.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <LeftSidebar />
      <SidebarInset>
    <div className="flex flex-col flex-grow">
      {!isAuthenticated ? (
        <Alert variant="error">
            <Translator path="pages.Page.notPartOfProject" />
        </Alert>
      ) : (
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
      )}
    </div>
    </SidebarInset>
        </SidebarProvider>
  );
};

export default Page;