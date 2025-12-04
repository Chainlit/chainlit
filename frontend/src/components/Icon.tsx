import * as LucideIcons from 'lucide-react';

interface Props {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

const Icon = ({ name, ...props }: Props) => {
  // Convert the name to proper case
  const formatIconName = (name: string): string => {
    //aggressively lowercase the parts to clean up inputs like "ChEvRoN-rIgHt"
    if (name.includes('-')) {
      return name
        .split('-')
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join('');
    }
    if (name === name.toUpperCase()) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
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
