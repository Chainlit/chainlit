import { useRecoilState } from 'recoil';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { datasetFiltersState } from 'state/dataset';

export default function FeedbackSelect() {
  const [df, setDf] = useRecoilState(datasetFiltersState);

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as unknown as number;
    const feedback = value === 0 ? undefined : value;
    setDf({ ...df, feedback });
  };

  return (
    <Box sx={{ width: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="feedback-filter-select">Feedback</InputLabel>
        <Select
          labelId="feedback-filter-select"
          value={df.feedback ? df.feedback.toString() : '0'}
          label="Feedback"
          onChange={handleChange}
          size="small"
        >
          <MenuItem value={0}>All</MenuItem>
          <MenuItem value={1}>Good</MenuItem>
          <MenuItem value={-1}>Bad</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
