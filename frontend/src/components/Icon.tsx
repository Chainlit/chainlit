import * as LucideIcons from 'lucide-react';

interface Props {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

const Icon = ({ name, ...props }: Props) => {
  // Convert the name to proper case
  // "plus" -> "Plus"
  // "chevron-right" -> "ChevronRight"
  // "ChevronRight" -> "ChevronRight"
  const formatIconName = (str: string): string => {
    return str
      .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toUpperCase());
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
