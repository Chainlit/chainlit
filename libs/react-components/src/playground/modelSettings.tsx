import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useFormik } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { useContext, useEffect } from 'react';
import { FormInput, SelectInput, TFormInput } from 'src/inputs';
import { getProviders } from 'src/playground/helpers/provider';
import * as yup from 'yup';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ILLMSettings } from 'client-types/';
import { ILLMProvider } from 'src/types/playground';

type Schema = {
  [key: string]: yup.Schema;
};

interface IFormProps {
  settings: ILLMSettings;
  schema: Schema;
  provider: ILLMProvider;
  providers: ILLMProvider[];
  providerWarning: JSX.Element | null;
  providerTooltip?: string;
}

const SettingsForm = ({
  settings,
  schema,
  provider,
  providers,
  providerTooltip,
  providerWarning
}: IFormProps) => {
  const { setPlayground } = useContext(PlaygroundContext);

  const formik = useFormik({
    initialValues: settings,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async () => undefined
  });

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setPlayground((old) => ({
        ...old,
        generation: {
          ...old!.generation!,
          settings: formik.values
        }
      }));
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [formik.values]);

  const onSelectedProviderChange = (event: SelectChangeEvent) => {
    setPlayground((old) =>
      merge(cloneDeep(old), {
        generation: {
          provider: event.target.value
        }
      })
    );
  };

  return (
    <Box width={250} sx={{ height: 'inherit' }}>
      <Typography fontSize="16px" fontWeight={600} color="text.primary">
        Settings
      </Typography>
      <Stack
        spacing={2}
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%'
        }}
      >
        <SelectInput
          items={providers?.map((provider: ILLMProvider) => ({
            label: provider.name,
            value: provider.id
          }))}
          id="llm-providers"
          value={provider.id}
          label="LLM Provider"
          tooltip={providerTooltip}
          onChange={onSelectedProviderChange}
        />
        {providerWarning}
        {provider.inputs.map((input: TFormInput, index: number) => (
          <Box
            // This trick is to have padding at the end of the scroll
            sx={{ paddingBottom: index === provider.inputs.length - 1 ? 2 : 0 }}
            key={input.id}
          >
            <FormInput
              element={{
                ...input,
                id: input.id,
                value: formik.values[input.id] as any,
                onChange: formik.handleChange,
                setField: formik.setFieldValue
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const ModelSettings = () => {
  const { playground } = useContext(PlaygroundContext);

  if (!playground || !playground?.providers) {
    return null;
  }

  const { provider, providerFound, providers } = getProviders(playground);

  if (!provider) {
    return null;
  }

  const buildProviderTooltip = () => {
    if (provider.is_chat && playground.generation?.type !== 'CHAT') {
      return `${provider.name} is chat-based. This prompt will be wrapped in a message before being sent to ${provider.name}.`;
    } else if (!provider.is_chat && playground.generation?.type === 'CHAT') {
      return `${provider.name} is completion-based. The messages will converted to a single prompt before being sent to ${provider.name}.`;
    } else {
      return undefined;
    }
  };

  const providerWarning = !providerFound ? (
    <Alert severity="warning">
      {playground.generation?.provider
        ? `${playground?.generation?.provider} provider is not found, using
      ${provider.name} instead.`
        : `Provider not specified, using ${provider.name} instead.`}
    </Alert>
  ) : null;

  const settings: ILLMSettings = {};
  const currentSettings = playground?.generation?.settings || {};
  const origSettings = playground?.originalGeneration?.settings || {};

  const isSettingCompatible = (
    value: string | number | boolean | string[],
    input: TFormInput
  ) => {
    if (input.type === 'select') {
      return !!input?.items?.find((i) => i.value === value);
    }
    return true;
  };

  const schema = yup.object(
    provider.inputs.reduce((object: Schema, input: TFormInput) => {
      const settingValue =
        currentSettings[input.id] !== undefined
          ? currentSettings[input.id]
          : origSettings[input.id];

      if (
        settingValue !== undefined &&
        isSettingCompatible(settingValue, input)
      ) {
        settings[input.id] = settingValue;
      } else if (input.initial !== undefined) {
        settings[input.id] = input.initial;
      }

      switch (input.type) {
        case 'select':
          object[input.id] = yup.string();
          break;
        case 'slider': {
          let schema = yup.number();
          if (input.min) {
            schema = schema.min(input.min);
          }
          if (input.max) {
            schema = schema.max(input.max);
          }
          object[input.id] = schema;
          break;
        }
        case 'tags':
          object[input.id] = yup.array().of(yup.string());
          break;
      }

      return object;
    }, {})
  );

  return (
    <SettingsForm
      provider={provider}
      providers={providers}
      providerWarning={providerWarning}
      providerTooltip={buildProviderTooltip()}
      schema={schema as unknown as Schema}
      settings={settings}
    />
  );
};

interface Props {
  isSmallScreen: boolean;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

export default function ResponsiveModelSettings({
  isSmallScreen,
  isDrawerOpen,
  toggleDrawer
}: Props) {
  return !isSmallScreen ? (
    <Box ml="32px !important" height="100%">
      <ModelSettings />
    </Box>
  ) : (
    <Drawer
      sx={{
        '& .MuiDrawer-paper': {}
      }}
      variant="persistent"
      anchor="right"
      open={isDrawerOpen}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          pt: 2,
          pr: 1
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
      <Box px={3}>
        <ModelSettings />
      </Box>
    </Drawer>
  );
}
