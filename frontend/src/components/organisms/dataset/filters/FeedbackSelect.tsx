import { useRecoilState } from 'recoil';

import Box from '@mui/material/Box';
import { SelectChangeEvent } from '@mui/material/Select';

import SelectInput, {
  SelectItem
} from 'components/organisms/inputs/selectInput';

import { datasetFiltersState } from 'state/dataset';

const items: SelectItem[] = [
  {
    value: 0,
    label: 'All'
  },
  {
    value: 1,
    label: 'Good'
  },
  {
    value: -1,
    label: 'Bad'
  }
];

export default function FeedbackSelect() {
  const [df, setDf] = useRecoilState(datasetFiltersState);

  const handleChange = (event: SelectChangeEvent) => {
    setDf({ ...df, feedback: parseInt(event.target.value) });
  };

  return (
    <Box sx={{ width: 120 }}>
      <SelectInput
        items={items}
        id="feedback-filter-select"
        value={df.feedback || 0}
        label="Feedback"
        onChange={handleChange}
      />
    </Box>
  );
}
