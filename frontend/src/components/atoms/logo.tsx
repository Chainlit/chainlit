import { useContext } from 'react';
import { useRecoilValue } from 'recoil';

import { settingsState } from 'state/settings';

import { ChainlitContext } from 'client-types/*';

interface Props {
  width?: number;
  style?: React.CSSProperties;
}

export const Logo = ({ style }: Props) => {
  const { theme } = useRecoilValue(settingsState);
  const apiClient = useContext(ChainlitContext);

  return (
    <img src={apiClient.getLogoEndpoint(theme)} alt="logo" style={style} />
  );
};
