import { useContext } from 'react';
import { useRecoilValue } from 'recoil';

import { settingsState } from 'state/settings';

import { ChainlitContext } from 'client-types/*';

interface Props {
  width?: number;
  style?: React.CSSProperties;
  onClick?: () => void; // Added onClick prop
}

export const Logo = ({ style, onClick }: Props) => {
  const { theme } = useRecoilValue(settingsState);
  const apiClient = useContext(ChainlitContext);

  return (
    <img
      src={apiClient.getLogoEndpoint(theme)}
      alt="logo"
      style={{ ...style, cursor: 'pointer' }}
      onClick={onClick} // Use the onClick prop
    />
  );
};
