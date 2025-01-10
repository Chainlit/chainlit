import * as LucideIcons from 'lucide-react';

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
