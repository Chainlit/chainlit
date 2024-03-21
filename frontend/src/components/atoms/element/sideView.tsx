import { useRecoilState } from 'recoil';

import { ElementSideView } from 'components/atoms/elements/ElementSideView';

import { sideViewState } from 'state/project';

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
