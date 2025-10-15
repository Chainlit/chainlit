import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { useContext } from 'react';

import { ChainlitContext } from '@chainlit/react-client';

interface Props {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

const Icon = ({ name, ...props }: Props) => {
  // Convert the name to proper case (e.g., "plus" -> "Plus", "chevron-right" -> "ChevronRight")
  const formatIconName = (str: string): string => {
    return str
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  };

  // Try to get the icon component using the formatted name
  const formattedName = formatIconName(name);
  const IconComponent = LucideIcons[
    formattedName as keyof typeof LucideIcons
  ] as any;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  return <IconComponent {...props} />;
};

export default Icon;

export const useRenderIcon = () => {
  const apiClient = useContext(ChainlitContext);

  const renderIcon = (icon?: string, alt?: string, className?: string) => {
    if (!icon) return null;

    const isUrl = icon.startsWith('http') || icon.startsWith('/public');

    if (isUrl) {
      const src = icon.startsWith('/public')
        ? apiClient.buildEndpoint(icon)
        : icon;
      return <img src={src} alt={alt ?? ''} className={className} />;
    }

    return (
      <Icon name={icon} className={cn(className, 'text-muted-foreground')} />
    );
  };

  return renderIcon;
};
