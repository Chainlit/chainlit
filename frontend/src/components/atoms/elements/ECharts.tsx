import { Suspense, lazy } from 'react';

import { ErrorBoundary } from 'components/atoms/ErrorBoundary';

import { useFetch } from 'hooks/useFetch';

import { type IEChartsElement } from 'client-types/';

const ReactECharts = lazy(() => import('echarts-for-react'));

interface Props {
  element: IEChartsElement;
}

const _EChartsElement = ({ element }: Props) => {
  const { data, error, isLoading } = useFetch(element.url || null);

  if (isLoading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>An error occurred</div>;
  }

  let options;

  if (data) {
    options = data;
  } else {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReactECharts
        option={options}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
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
