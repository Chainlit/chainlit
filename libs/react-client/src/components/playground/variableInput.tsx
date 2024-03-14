import map from 'lodash/map';
import { useContext } from 'react';
import { PlaygroundContext } from 'src/contexts/PlaygroundContext';

import { SelectInput } from 'src/components/inputs/selects/SelectInput';

const VariableInput = (): JSX.Element | null => {
  const { variableName, setVariableName, playground } =
    useContext(PlaygroundContext);

  const variables = map(playground?.generation?.inputs, (input, index) => ({
    label: index,
    value: index
  }));

  return variables?.length > 0 ? (
    <SelectInput
      items={variables}
      id="variable-select"
      value={variableName || ''}
      label="Edit a variable"
      onChange={(e) => setVariableName(e.target.value)}
      sx={{ maxWidth: '270px' }}
    />
  ) : null;
};

export default VariableInput;
