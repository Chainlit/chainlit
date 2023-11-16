import { apiClient } from 'api';
import { useRecoilValue } from 'recoil';

import { settingsState } from 'state/settings';

interface Props {
  width?: number;
  style?: React.CSSProperties;
}

export const Logo = ({ style }: Props) => {
  const { theme } = useRecoilValue(settingsState);

  return (
    <img src={apiClient.getLogoEndpoint(theme)} alt="logo" style={style} />
  );
};
