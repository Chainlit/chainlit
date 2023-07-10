import { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { clientState } from 'state/client';
import { datasetFiltersState } from 'state/dataset';
import { IMember, roleState } from 'state/user';

export default function AuthorSelect() {
  const client = useRecoilValue(clientState);
  const role = useRecoilValue(roleState);
  const [df, setDf] = useRecoilState(datasetFiltersState);
  const [members, setMembers] = useState<IMember[]>();

  useEffect(() => {
    client.getProjectMembers().then((res) => setMembers(res));
  }, [client]);

  if (!members || role === 'USER') {
    return null;
  }

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    const authorEmail = value === 'All' ? undefined : value;
    setDf({ ...df, authorEmail });
  };

  return (
    <Box sx={{ width: 200 }}>
      <FormControl fullWidth>
        <InputLabel id="author-filter-select">Author</InputLabel>
        <Select
          labelId="author-filter-select"
          value={df.authorEmail || 'All'}
          label="Author"
          onChange={handleChange}
          size="small"
        >
          <MenuItem value={'All'}>All</MenuItem>
          {members.map((m) => (
            <MenuItem key={m.email} value={m.email}>
              {m.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
