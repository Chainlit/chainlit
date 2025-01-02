import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Suspense, lazy } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';

const fallback = <div className="h-4 w-4 bg-muted" />;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports;
}

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = lazy(dynamicIconImports[name]);

  return (
    <ErrorBoundary prefix="Failed to load icon: ">
      <Suspense fallback={fallback}>
        <LucideIcon {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Icon;
