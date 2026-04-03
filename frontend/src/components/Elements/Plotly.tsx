import { Suspense, lazy, useMemo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

import { useFetch } from 'hooks/useFetch';

import { type IPlotlyElement } from 'client-types/';

const Plot = lazy(() => import('react-plotly.js'));

interface Props {
  element: IPlotlyElement;
}

const _PlotlyElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);

  // deep-clone SWR data so Plotly.js mutations don't corrupt the cache.
  // keyed on the data reference so clones stay stable between re-renders,
  // preserving react-plotly.js's prevProps === this.props skip check.
  const plotly = useMemo(() => {
    if (!data) return null;
    return {
      data: structuredClone(data.data),
      layout: structuredClone(data.layout),
      frames: data.frames ? structuredClone(data.frames) : undefined,
      config: data.config ? structuredClone(data.config) : undefined,
      height: data.layout?.height || 400
    };
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred</div>;
  if (!plotly) return null;

  return (
    <Suspense fallback={<Skeleton className="h-full rounded-md" />}>
      <div style={{ width: '100%', height: `${plotly.height}px` }}>
        <Plot
          className={`${element.display}-plotly`}
          data={plotly.data}
          layout={plotly.layout}
          frames={plotly.frames}
          config={plotly.config}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '1rem',
            overflow: 'hidden'
          }}
          useResizeHandler={true}
        />
      </div>
    </Suspense>
  );
};

const PlotlyElement = (props: Props) => {
  return (
    <ErrorBoundary prefix="Failed to load chart.">
      <_PlotlyElement {...props} />
    </ErrorBoundary>
  );
};

export { PlotlyElement };
