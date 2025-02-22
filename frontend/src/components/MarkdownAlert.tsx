import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  BookOpen,
  Bug,
  CheckCircle,
  Clock,
  Heart,
  HelpCircle,
  Info,
  Lightbulb,
  Rocket,
  Shield
} from 'lucide-react';
// unist-util-visit is a utility for walking AST (Abstract Syntax Tree) nodes in markdown processing,
// used here to find and transform ::: alert syntax into Alert components
import { visit } from 'unist-util-visit';

import { useTranslation } from '@/components/i18n/Translator';

export interface AlertProps {
  variant: AlertVariant;
  children?: React.ReactNode;
}
// Alert type definition
export const AlertTypes = [
  'info',
  'note',
  'tip',
  'important',
  'warning',
  'caution',
  'debug',
  'example',
  'success',
  'help',
  'idea',
  'pending',
  'security',
  'beta',
  'best-practice'
  // 'your-new-type';
] as const;
export type AlertVariant = (typeof AlertTypes)[number];
// Styles and icon configuration
const variantStyles = {
  // Basic alerts
  info: {
    container:
      'bg-blue-50 border-l-4 border-l-blue-400 dark:bg-blue-950 dark:border-l-blue-500',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-200',
    Icon: Info
  },
  note: {
    container:
      'bg-gray-50 border-l-4 border-l-gray-400 dark:bg-gray-900 dark:border-l-gray-500',
    icon: 'text-gray-500 dark:text-gray-400',
    text: 'text-gray-700 dark:text-gray-200',
    Icon: BellRing
  },
  tip: {
    container:
      'bg-green-50 border-l-4 border-l-green-400 dark:bg-green-950 dark:border-l-green-500',
    icon: 'text-green-500 dark:text-green-400',
    text: 'text-green-700 dark:text-green-200',
    Icon: CheckCircle
  },
  important: {
    container:
      'bg-purple-50 border-l-4 border-l-purple-400 dark:bg-purple-950 dark:border-l-purple-500',
    icon: 'text-purple-500 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-200',
    Icon: AlertCircle
  },
  warning: {
    container:
      'bg-yellow-50 border-l-4 border-l-yellow-400 dark:bg-yellow-950 dark:border-l-yellow-500',
    icon: 'text-yellow-500 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-200',
    Icon: AlertTriangle
  },
  caution: {
    container:
      'bg-red-50 border-l-4 border-l-red-400 dark:bg-red-950 dark:border-l-red-500',
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-700 dark:text-red-200',
    Icon: AlertTriangle
  },

  // Development related
  debug: {
    container:
      'bg-gray-50 border-l-4 border-l-gray-400 dark:bg-gray-900 dark:border-l-gray-500',
    icon: 'text-gray-500 dark:text-gray-400',
    text: 'text-gray-700 dark:text-gray-200',
    Icon: Bug
  },
  example: {
    container:
      'bg-indigo-50 border-l-4 border-l-indigo-400 dark:bg-indigo-950 dark:border-l-indigo-500',
    icon: 'text-indigo-500 dark:text-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-200',
    Icon: BookOpen
  },

  // Functional alerts
  success: {
    container:
      'bg-green-50 border-l-4 border-l-green-400 dark:bg-green-950 dark:border-l-green-500',
    icon: 'text-green-500 dark:text-green-400',
    text: 'text-green-700 dark:text-green-200',
    Icon: CheckCircle
  },
  help: {
    container:
      'bg-blue-50 border-l-4 border-l-blue-400 dark:bg-blue-950 dark:border-l-blue-500',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-200',
    Icon: HelpCircle
  },
  idea: {
    container:
      'bg-yellow-50 border-l-4 border-l-yellow-400 dark:bg-yellow-950 dark:border-l-yellow-500',
    icon: 'text-yellow-500 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-200',
    Icon: Lightbulb
  },

  // Status alerts
  pending: {
    container:
      'bg-orange-50 border-l-4 border-l-orange-400 dark:bg-orange-950 dark:border-l-orange-500',
    icon: 'text-orange-500 dark:text-orange-400',
    text: 'text-orange-700 dark:text-orange-200',
    Icon: Clock
  },
  security: {
    container:
      'bg-slate-50 border-l-4 border-l-slate-400 dark:bg-slate-950 dark:border-l-slate-500',
    icon: 'text-slate-500 dark:text-slate-400',
    text: 'text-slate-700 dark:text-slate-200',
    Icon: Shield
  },
  beta: {
    container:
      'bg-violet-50 border-l-4 border-l-violet-400 dark:bg-violet-950 dark:border-l-violet-500',
    icon: 'text-violet-500 dark:text-violet-400',
    text: 'text-violet-700 dark:text-violet-200',
    Icon: Rocket
  },
  'best-practice': {
    container:
      'bg-teal-50 border-l-4 border-l-teal-400 dark:bg-teal-950 dark:border-l-teal-500',
    icon: 'text-teal-500 dark:text-teal-400',
    text: 'text-teal-700 dark:text-teal-200',
    Icon: Heart
  }
  // we can add new types here later, but remember to update translation.json file under "alerts".
  //  'your-new-type': {
  //    container: 'bg-teal-50 border-l-4 border-l-teal-400 dark:bg-teal-950 dark:border-l-teal-500',
  //    icon: 'text-teal-500 dark:text-teal-400',
  //    text: 'text-teal-700 dark:text-teal-200',
  //    Icon: Heart
  //  }
};

// Alert component
const AlertComponent = ({
  variant,
  children
}: {
  variant: AlertVariant;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const style = variantStyles[variant];
  const Icon = style.Icon;

  return (
    <div className={cn('rounded-lg p-4 mb-4', style.container)}>
      <div className="flex">
        <div className={cn('flex-shrink-0', style.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="ml-3">
          <div className={cn('text-sm font-medium mb-1', style.text)}>
            {t(`alerts.${variant}`)}
          </div>
          <div className={cn('text-sm', style.text)}>{children}</div>
        </div>
      </div>
    </div>
  );
};
// MarkdownAlert plugin
export const MarkdownAlert = () => {
  return (tree: any) => {
    visit(tree, 'text', (node) => {
      const regex = /^:::\s*([\w-]+)\n([\s\S]*?)\n:::/i;
      const match = node.value.match(regex);

      if (match) {
        const [, type, content] = match;
        node.type = 'element';
        node.data = {
          hName: 'Alert',
          hProperties: { variant: normalizeAlertType(type) }
        };
        node.children = [{ type: 'text', value: content.trim() }];
      }
    });
  };
};
export const normalizeAlertType = (type: string): AlertVariant => {
  if (!type) return 'info';
  const normalized = type.toLowerCase().replace(/[-_\s]/g, '-');
  if (!AlertTypes.includes(normalized as AlertVariant)) {
    console.warn(`Invalid alert type "${type}", falling back to "info"`);
    return 'info';
  }
  return normalized as AlertVariant;
};

export const alertComponents = {
  Alert: AlertComponent
};
