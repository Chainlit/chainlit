import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { Input, Switch, Typography } from '@mui/material';
import Box from '@mui/material/Box';

import Select from 'components/Select';
import InputLabel from 'components/inputLabel';
import Slider from 'components/slider';

import { settingsState } from 'state/settings';

export default function Design(): JSX.Element {
  const navigate = useNavigate();
  const [settings, setSettings] = useRecoilState(settingsState);

  const voidFunction = () => {
    console.log('clicked');
  };

  if (process.env.NODE_ENV === 'production') {
    navigate && navigate('/');
    return <></>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={1} py={2}>
      <Box display="flex" flexDirection="row" gap={1}>
        <Typography fontWeight={700} fontSize="20px">
          {`Dark mode`}
        </Typography>
        <Switch
          onChange={() => {
            const variant = settings.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeVariant', variant);
            setSettings((old) => ({ ...old, theme: variant }));
          }}
          checked={settings.theme === 'dark'}
          inputProps={{
            'aria-labelledby': 'switch-theme'
          }}
        />
      </Box>

      <Box display="flex" flexDirection="row" gap={1}>
        <Typography fontWeight={700} fontSize="20px">
          {`<Input/>`}
        </Typography>
        <Input onSubmit={voidFunction} />
      </Box>

      <Box display="flex" flexDirection="row" gap={1}>
        <Typography fontWeight={700} fontSize="20px">
          {`<InputLabel/>`}
        </Typography>
        <InputLabel
          label={'Test'}
          tooltip="This is my tooltip"
          notificationsCount={10}
        />
      </Box>

      <Box display="flex" flexDirection="row" gap={1}>
        <Typography fontWeight={700} fontSize="20px">
          {`<Select/>`}
        </Typography>
        <Select
          label="Author"
          id="author-filter-select"
          value={'first'}
          onChange={voidFunction}
          items={[
            { label: 'First', value: 'first' },
            { label: 'Second', value: 'second', notificationCount: 20 },
            { label: 'Third', value: 'third' }
          ]}
        />
      </Box>

      <Box display="flex" flexDirection="row" gap={1}>
        <Typography fontWeight={700} fontSize="20px">
          {`<Slider/>`}
        </Typography>
        <Slider
          label="Temperature"
          name="temperature"
          min={0}
          max={1}
          step={0.1}
        />
      </Box>
    </Box>
  );
}
