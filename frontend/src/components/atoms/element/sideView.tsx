import { useRecoilState } from 'recoil';

import { sideViewState } from '@chainlit/react-client';

import { ElementSideView } from 'components/atoms/elements/ElementSideView';

interface SideViewProps {
  children: React.ReactNode;
}

const SideView = ({ children }: SideViewProps) => {
  const [sideViewElement, setSideViewElement] = useRecoilState(sideViewState);

  return (
    <ElementSideView
      onClose={() => setSideViewElement(undefined)}
      isOpen={!!sideViewElement}
      element={sideViewElement}
    >
      {children}
    </ElementSideView>
  );
};

export default SideView;
