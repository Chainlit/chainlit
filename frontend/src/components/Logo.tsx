import { cn } from '@/lib/utils';
import { useContext } from 'react';
import { ChainlitContext, useConfig } from '@chainlit/react-client';
import { useTheme } from './ThemeProvider';

interface Props {
  className?: string;
}

export const Logo = ({ className }: Props) => {
  const { variant } = useTheme();
  const { config } = useConfig();
  const chainlit = useContext(ChainlitContext);
  const rawUrl = chainlit.getLogoEndpoint(variant, config?.ui?.logo_file_url);
  // Fix: resolve absolute URL for standalone/reverse-proxy deployments
  const baseUrl = chainlit.httpEndpoint ?? '';
  const logoUrl = rawUrl?.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
  return (
    <img
      src={logoUrl}
      alt="logo"
      className={cn('logo', className)}
    />
  );
};
