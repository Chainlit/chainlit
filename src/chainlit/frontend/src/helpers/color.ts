import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

const lightColors = [
  '#066DEB',
  '#04857C',
  '#FF9900',
  '#F34F3C',
  '#E86004',
  '#2D8C26',
  '#5E5BFE',
  '#A132FE'
];

const darkColors = [
  '#67A0F8',
  '#25B1A7',
  '#FFC266',
  '#F09691',
  '#FA7F54',
  '#59C654',
  '#9695F8',
  '#B889F8'
];

function hashCode(str: string) {
  const arr = str.split('');
  return arr.reduce(
    (hashCode, currentVal) =>
      (hashCode =
        currentVal.charCodeAt(0) +
        (hashCode << 6) +
        (hashCode << 16) -
        hashCode),
    0
  );
}

export function useColorForName() {
  const pSettings = useRecoilValue(projectSettingsState);
  const { theme } = useRecoilValue(settingsState);

  const colors = theme === 'dark' ? darkColors : lightColors;

  return function (name: string, isUser?: boolean, isError?: boolean) {
    if (isError) {
      return 'error.main';
    }
    if (name === pSettings?.ui?.name) {
      return 'primary.main';
    }
    if (isUser) {
      return 'text.primary';
    }
    const index = Math.abs(hashCode(name)) % colors.length;
    return colors[index];
  };
}
