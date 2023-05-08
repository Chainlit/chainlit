import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import { themeState } from 'state/theme';

const lightColors = ['#066DEB', '#FF9900', '#066DEB'];

const darkColors = ['#67A0F8', '#FFC266', '#67A0F8'];

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
  const theme = useRecoilValue(themeState);

  const colors = theme === 'dark' ? darkColors : lightColors;

  return function (name: string, isUser?: boolean, isError?: boolean) {
    if (isError) {
      return 'error.main';
    }
    if (name === pSettings?.appTitle) {
      return 'primary.main';
    }
    if (isUser) {
      return 'text.primary';
    }
    const index = Math.abs(hashCode(name)) % colors.length;
    console.log(name, colors[index]);
    return colors[index];
  };
}
