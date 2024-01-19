import { useRecoilValue } from 'recoil';

import { apiClientState } from 'state/apiClient';
import { settingsState } from 'state/settings';

interface Props {
  width?: number;
  style?: React.CSSProperties;
}

export const Logo = ({ style }: Props) => {
  const { theme } = useRecoilValue(settingsState);
  const apiClient = useRecoilValue(apiClientState);

  return (
    <img src={apiClient.getLogoEndpoint(theme)} alt="logo" style={style} />
  );
};
