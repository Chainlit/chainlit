import * as LucideIcons from 'lucide-react';

interface Props {
  name: string;
  className?: string;
}

const Icon = ({ name, ...props }: Props) => {
  // Get the icon component dynamically from LucideIcons
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as any;

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
};

export default Icon;
