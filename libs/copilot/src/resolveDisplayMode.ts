import { DisplayMode } from './types';

export const LS_DISPLAY_MODE_KEY = 'chainlit-copilot-displayMode';

export function resolveDisplayMode(
  configDisplayMode: DisplayMode | undefined
): DisplayMode {
  return (
    configDisplayMode ||
    (localStorage.getItem(LS_DISPLAY_MODE_KEY) as DisplayMode) ||
    'floating'
  );
}
