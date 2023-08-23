import { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import Box from '@mui/material/Box';
import { SelectChangeEvent } from '@mui/material/Select';

import SelectInput, {
  SelectItem
} from 'components/organisms/inputs/selectInput';

import { clientState } from 'state/client';
import { datasetFiltersState } from 'state/dataset';
import { roleState } from 'state/user';

export default function AuthorSelect() {
  const client = useRecoilValue(clientState);
  const role = useRecoilValue(roleState);
  const [df, setDf] = useRecoilState(datasetFiltersState);
  const [members, setMembers] = useState<SelectItem[]>();

  useEffect(() => {
    client.getProjectMembers().then((res) => {
      const members = res.map((member) => ({
        value: member.email,
        label: member.email
      }));

      setMembers([{ value: 'All', label: 'All' }, ...members]);
    });
  }, [client]);

  if (!members || role === 'USER') {
    return null;
  }

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
