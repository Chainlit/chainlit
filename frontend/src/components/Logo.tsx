import { cn } from '@/lib/utils';
import { useContext } from 'react';

import { ChainlitContext, useConfig } from '@chainlit/react-client';

import { useTheme } from './ThemeProvider';

interface Props {
  className?: string;
  themeVariant?: 'light' | 'dark';
}

export const Logo = ({ className, themeVariant }: Props) => {
  const { variant } = useTheme();
  const { config } = useConfig();
  const apiClient = useContext(ChainlitContext);

  return (
    <img
      src={apiClient.getLogoEndpoint(
        themeVariant ?? variant,
        config?.ui?.logo_file_url
      )}
      alt="logo"
      className={cn('logo', className)}
    />
  );
};
