import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { IStep } from '@chainlit/react-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasMessage = (messages: IStep[]): boolean => {
  const validTypes = ['user_message', 'assistant_message', 'tool'];
  return messages.some(
    (message) =>
      validTypes.includes(message.type) || hasMessage(message.steps || [])
  );
};

export const generateFilterStyle = (filter?: string): string => {
  if (!filter) return '';

  const filterMap: Record<string, (value: string) => string> = {
    'blur': (value) => `blur(${value})`,
    'brightness': (value) => `brightness(${value})`,
    'contrast': (value) => `contrast(${value})`,
    'grayscale': (value) => `grayscale(${value})`,
    'opacity': (value) => `opacity(${value})`
  };

  const baseFilters: string[] = [];
  const lightFilters: string[] = [];
  const darkFilters: string[] = [];
  const filters = filter.split(' ');
  filters.forEach(f => {
    const match = f.match(/^(light:|dark:)?(\w+)-\[(.+?)\]$/);
    if (match) {
      const [_, themePrefix, filterName, value] = match;
      const transformer = filterMap[filterName];
      if (transformer) {
        const cssFilter = transformer(value);
        if (themePrefix === 'dark:') {
          darkFilters.push(cssFilter);
        } else if (themePrefix === 'light:') {
          lightFilters.push(cssFilter);
        } else {
          baseFilters.push(cssFilter);
        }
      }
    }
  });
  const isDark = document.documentElement.classList.contains('dark');

  return (baseFilters.join(' ') + ' ' + (isDark ? darkFilters.join(' ') : lightFilters.join(' '))).trim();
};

export function hslToHex(hslStr: string): string {
  // Parse HSL string
  const values = hslStr
    .split(' ')
    .map((value) => parseFloat(value.replace('%', '')));

  const h = values[0];
  const s = values[1];
  const l = values[2];

  // Convert to fractions of 1
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;

  function hueToRgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  let r, g, b;

  if (sat === 0) {
    r = g = b = light;
  } else {
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;

    r = hueToRgb(p, q, hue + 1 / 3);
    g = hueToRgb(p, q, hue);
    b = hueToRgb(p, q, hue - 1 / 3);
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
