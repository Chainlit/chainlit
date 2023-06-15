import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useRecoilState, useRecoilValue } from 'recoil';
import { gql, useQuery } from '@apollo/client';
import { datasetFiltersState } from 'state/dataset';
import { projectSettingsState } from 'state/project';
import { roleState } from 'state/user';

const MembersQuery = gql`
  query ($projectId: String!) {
    projectMembers(projectId: $projectId) {
      edges {
        cursor
        node {
          role
          user {
            email
            name
          }
        }
      }
    }
  }
`;

export default function AuthorSelect() {
  const role = useRecoilValue(roleState);
  const [df, setDf] = useRecoilState(datasetFiltersState);
  const pSettings = useRecoilValue(projectSettingsState);
  const { data, loading, error } = useQuery(MembersQuery, {
    variables: { projectId: pSettings?.project?.id }
  });

  if (loading || error || role === 'USER') {
    return null;
  }

  const members = data.projectMembers.edges.map((e: any) => e.node);

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
          {members.map((m: any) => (
            <MenuItem key={m.user.id} value={m.user.email}>
              {m.user.email}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
