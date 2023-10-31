import Plot from 'react-plotly.js';

import { IPlotlyElement } from 'src/types/element';

interface Props {
  element: IPlotlyElement;
}

const PlotlyElement = ({ element }: Props) => {
  if (!element.content) {
    return null;
  }
  const state = JSON.parse(element.content);

  return (
    <Plot
      className={`${element.display}-plotly`}
      data={state.data}
      layout={state.layout}
      frames={state.frames}
      config={state.config}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
    />
  );
};

export { PlotlyElement };
