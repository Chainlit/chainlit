import { useHotkeys } from 'react-hotkeys-hook';
import { useSetRecoilState } from 'recoil';

import { settingsState } from 'state/settings';

export default function Hotkeys() {
  const setSettings = useSetRecoilState(settingsState);
  useHotkeys('s', () => setSettings((old) => ({ ...old, open: !old.open })));

  return null;
}
