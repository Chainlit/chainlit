import { useRecoilState, useRecoilValue } from 'recoil';

import Box from '@mui/material/Box';
import { SelectChangeEvent } from '@mui/material/Select';

import SelectInput, {
  SelectItem
} from 'components/organisms/inputs/selectInput';

import { useApi } from 'hooks/useApi';

import { datasetFiltersState } from 'state/dataset';
import { roleState } from 'state/user';

import { IMember } from 'types/user';

export default function AuthorSelect() {
  const role = useRecoilValue(roleState);
  const [df, setDf] = useRecoilState(datasetFiltersState);

  const { data, isLoading } = useApi<IMember[]>('/project/members');

  if (!isLoading || !data || role === 'USER') {
    return null;
  }

  const members: SelectItem[] = [
    { value: 'All', label: 'All' },
    ...data.map((member) => ({
      value: member.email,
      label: member.email
    }))
  ];

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    const authorEmail = value === 'All' ? undefined : value;
    setDf({ ...df, authorEmail });
  };

  return (
    <Box sx={{ width: 200 }}>
      <SelectInput
        items={members}
        id="author-filter-select"
        value={df.authorEmail || 'All'}
        label="Author"
        onChange={handleChange}
      />
    </Box>
  );
}
