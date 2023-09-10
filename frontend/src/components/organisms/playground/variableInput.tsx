import map from 'lodash/map';
import { useRecoilState, useRecoilValue } from 'recoil';

import { SelectInput } from '@chainlit/components';

import { playgroundState, variableState } from 'state/playground';

const VariableInput = (): JSX.Element | null => {
  const [variableName, setVariableName] = useRecoilState(variableState);
  const playground = useRecoilValue(playgroundState);

  const variables = map(playground?.prompt?.inputs, (input, index) => ({
    label: index,
    value: index
  }));

  return variables?.length > 0 ? (
    <SelectInput
      items={variables}
      id="variable-select"
      value={variableName || ''}
      label="Select a variable"
      onChange={(e) => setVariableName(e.target.value)}
      sx={{ maxWidth: '270px' }}
    />
  ) : null;
};

export default VariableInput;
