import { green, grey, primary } from 'palette';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import Switch from 'components/atoms/switch';
import InputLabel from 'components/molecules/inputLabel';
import SelectInput from 'components/organisms/inputs/selectInput';
import TextInput from 'components/organisms/inputs/textInput';
import Slider from 'components/organisms/slider';

import useIsDarkMode from 'hooks/useIsDarkMode';

import { settingsState } from 'state/settings';

export default function Design(): JSX.Element {
  const navigate = useNavigate();
  const [settings, setSettings] = useRecoilState(settingsState);
  const isDarkMode = useIsDarkMode();

  const voidFunction = (data?: any) => {
    console.log('Function called. Data: ', data);
  };

  if (process.env.NODE_ENV === 'production') {
    navigate && navigate('/');
    return <></>;
  }

  const ContainerBox = ({
    children,
    name
  }: {
    children: React.ReactNode;
    name: string;
  }) => (
    <Box display="flex" gap={1} flexDirection="column">
      <Typography fontWeight={700} fontSize="20px" color={green[400]}>
        {`${name}:`}
      </Typography>
      <Box display="flex" gap={4} flexDirection="row">
        {children}
      </Box>
    </Box>
  );

  const ComponentBox = ({
    children,
    name
  }: {
    children: React.ReactNode;
    name: string;
  }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid black',
        borderRadius: 1,
        padding: 1,
        gap: 1,
        minWidth: '200px'
      }}
    >
      <Typography fontWeight={700} fontSize="14px" color={primary[400]}>
        {`<${name}/>`}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}
      >
        {children}
      </Box>
    </Box>
  );

  const onDarkModeChange = () => {
    const variant = settings.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('themeVariant', variant);
    setSettings((old) => ({ ...old, theme: variant }));
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} p={2}>
      <Box display="flex" flexDirection="row" gap={1}>
        <Typography
          fontWeight={700}
          fontSize="20px"
          color={isDarkMode ? grey[100] : grey[700]}
        >
          {`Dark mode`}
        </Typography>
        <Switch
          onChange={onDarkModeChange}
          checked={isDarkMode}
          inputProps={{
            'aria-labelledby': 'switch-theme'
          }}
        />
      </Box>

      <ContainerBox name="Inputs">
        <ComponentBox name="TextInput">
          <TextInput
            label="my label"
            tooltip="Ok bro"
            description="My description"
            onChange={voidFunction}
            id={'design-input'}
          />
        </ComponentBox>
        <ComponentBox name="InputLabel">
          <InputLabel
            label={'Test'}
            tooltip="This is my tooltip"
            notificationsCount={10}
          />
        </ComponentBox>
        <ComponentBox name="Select">
          <SelectInput
            label="Author"
            tooltip="This is my author"
            id="author-filter-select"
            description="test"
            value={'first'}
            onChange={voidFunction}
            items={[
              { label: 'First', value: 'first' },
              { label: 'Second', value: 'second', notificationCount: 20 },
              { label: 'Third', value: 'third' }
            ]}
          />
        </ComponentBox>
      </ContainerBox>

      <ContainerBox name="Uncategorized">
        <ComponentBox name="Select">
          <Slider
            label="Temperature"
            name="temperature"
            min={0}
            max={1}
            step={0.1}
          />
        </ComponentBox>

        <ComponentBox name="Switch">
          <Switch
            onChange={onDarkModeChange}
            checked={isDarkMode}
            inputProps={{
              'aria-labelledby': 'switch-theme'
            }}
          />
        </ComponentBox>
      </ContainerBox>
    </Box>
  );
}
