export const shouldAutoFocusMessageComposer = (
  clientType: string,
  isMobile: boolean
) => clientType === 'copilot' || !isMobile;
