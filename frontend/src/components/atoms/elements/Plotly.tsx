import { Suspense, lazy } from 'react';

import { ErrorBoundary } from 'components/atoms/ErrorBoundary';

import { useFetch } from 'hooks/useFetch';

import { type IPlotlyElement } from 'client-types/';

const Plot = lazy(() => import('react-plotly.js'));

interface Props {
  element: IPlotlyElement;
}

const _PlotlyElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);

  if (isLoading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>An error occured</div>;
  }

  let state;

  if (data) {
    state = data;
  } else {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Plot
        className={`${element.display}-plotly`}
        data={state.data}
        layout={state.layout}
        frames={state.frames}
        config={state.config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
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
