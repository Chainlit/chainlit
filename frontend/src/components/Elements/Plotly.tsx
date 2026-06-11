

import { Suspense, useMemo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { type IPlotlyElement } from '@chainlit/react-client';

// Chargement dynamique SANS rendu serveur pour Ã©viter l'erreur "window is not defined"
const Plot = React.lazy(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />
});

interface Props {
  element: IPlotlyElement;
}

const _PlotlyElement = ({ element }: Props) => {
  const { data: rawData, error, isLoading } = useFetch(element.url || null);

  const plotly = useMemo(() => {
    if (!rawData) return null;
    
    // Si useFetch retourne une string (JSON), on la parse
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    return {
      data: structuredClone(data.data || []),
      layout: structuredClone(data.layout || {}),
      frames: data.frames ? structuredClone(data.frames) : undefined,
      config: data.config ? structuredClone(data.config) : undefined,
      height: data.layout?.height || 400
    };
  }, [rawData]);

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (error) return <div className="text-destructive">Une erreur est survenue lors du chargement du graphique.</div>;
  if (!plotly) return null;

  return (
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