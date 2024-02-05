// EChartsElement.jsx
// Added by Jay 22/1/2024
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'src/ErrorBoundary';

import { useFetch } from 'hooks/useFetch';

import { type IEChartsElement } from 'client-types/';

// Update the import based on your actual client types
// Use lazy to perform dynamic import
const ReactECharts = lazy(() => import('echarts-for-react'));

interface Props {
  element: IEChartsElement; // Update the interface based on your actual client types
}

const _EChartsElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);
  console.log('Mrituanjay');
  if (isLoading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>An error occurred</div>;
  }

  let option;

  if (data) {
    option = data;
  } else {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReactECharts
        option={option}
        notMerge={true}
        lazyUpdate={true}
        theme={'default'} // Use the provided theme or fallback to 'default'
        onChartReady={undefined} // Optional chart ready callback
        onEvents={{}} // Optional events dictionary
        opts={{}} // Optional extra options
        className={`${element.display}-echarts`} // Update the class name based on your needs
        style={{ width: '100%', height: '100%' }}
      />
    </Suspense>
  );
};

const EChartsElement = (props: Props) => {
  return (
    <ErrorBoundary prefix="Failed to load chart.">
      <_EChartsElement {...props} />
    </ErrorBoundary>
  );
};

export { EChartsElement };
