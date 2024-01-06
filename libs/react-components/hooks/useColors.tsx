import { useCallback } from 'react';

import { useIsDarkMode } from './useIsDarkMode';

const darkColors = [
  '#fb923c',
  '#facc15',
  '#34d399',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#0ea5e9'
];

const lightColors = [
  '#ea580c',
  '#ca8a04',
  '#059669',
  '#0284c7',
  '#4f46e5',
  '#9333ea',
  '#db2777',
  '#2563eb'
];

const hashCode = (str: string) => {
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
};

const useColors = (inverted?: boolean) => {
  const isDarkMode = useIsDarkMode();
  let colors = isDarkMode ? darkColors : lightColors;

  if (inverted) {
    if (colors === darkColors) {
      colors = lightColors;
    } else {
      colors = darkColors;
    }
  }
  return colors;
};

const useColorForName = (uiName: string) => {
  const colors = useColors();

  return useCallback(
    (name: string, isUser?: boolean, isError?: boolean) => {
      if (isError) {
        return 'error.main';
      }
      if (name === uiName) {
        return 'primary.main';
      }
      if (isUser) {
        return 'text.primary';
      }
      const index = Math.abs(hashCode(name)) % colors.length;
      return colors[index];
    },
    [uiName]
  );
};

export { useColorForName, useColors };
