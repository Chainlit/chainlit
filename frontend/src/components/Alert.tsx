import { cn } from '@/lib/utils';
import React from 'react';

type AlertVariant = 'info' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const variantStyles = {
  info: {
    light: {
      container:
        'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900',
      icon: 'text-blue-400 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-200'
    },
    dark: {
      container: 'bg-blue-950 border-blue-900',
      icon: 'text-blue-300',
      text: 'text-blue-200'
    }
  },
  error: {
    light: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900',
      icon: 'text-red-400 dark:text-red-300',
      text: 'text-red-700 dark:text-red-200'
    },
    dark: {
      container: 'bg-red-950 border-red-900',
      icon: 'text-red-300',
      text: 'text-red-200'
    }
  }
};

const icons = {
  info: (
    <svg
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  )
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className,
  id
}) => {
  const styles = variantStyles[variant].light;

  return (
    <div
      id={id}
      className={cn(
        'border rounded-lg p-4 mb-4 alert',
        styles.container,
        className
      )}
    >
      <div className="flex">
        <div className={cn('flex-shrink-0', styles.icon)}>{icons[variant]}</div>
        <div className="ml-3">
          <p className={cn('text-sm', styles.text)}>{children}</p>
        </div>
      </div>
    </div>
  );
};

export default Alert;
