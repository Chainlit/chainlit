import { cn } from '@/lib/utils';
import { useContext } from 'react';

import { ChainlitContext } from '@chainlit/react-client';

import { useTheme } from './ThemeProvider';

interface Props {
  className?: string;
}

export const Logo = ({ className }: Props) => {
  const { variant } = useTheme();
  const apiClient = useContext(ChainlitContext);

  return (
    <img
      src={apiClient.getLogoEndpoint(variant)}
      alt="logo"
      className={cn('logo', className)}
    />
  );
};
