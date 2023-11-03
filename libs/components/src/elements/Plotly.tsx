import { Suspense, lazy } from 'react';

import { IPlotlyElement } from 'src/types/element';

const Plot = lazy(() => import('react-plotly.js'));

interface Props {
  element: IPlotlyElement;
}

const PlotlyElement = ({ element }: Props) => {
  if (!element.content) {
    return null;
  }
  const state = JSON.parse(element.content);

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

export { PlotlyElement };
