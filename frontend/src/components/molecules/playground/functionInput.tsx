import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useContext } from 'react';

import { SelectInput } from 'components/atoms/inputs/selects/SelectInput';

const FunctionInput = (): JSX.Element | null => {
  const { functionIndex, setFunctionIndex, playground } =
    useContext(PlaygroundContext);

  const functions = playground?.generation?.tools || [];

  const options = functions.map((fn, index) => ({
    label: fn.function.name,
    value: index.toString()
  }));

  return functions?.length > 0 ? (
    <SelectInput
      items={options}
      id="function-select"
      value={functionIndex !== undefined ? functionIndex.toString() : ''}
      label="Edit a function"
      onChange={(e) => setFunctionIndex(parseInt(e.target.value, 10))}
      sx={{ maxWidth: '270px' }}
    />
  ) : null;
};

export default FunctionInput;
