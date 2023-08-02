import { useFormik } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import * as yup from 'yup';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Alert,
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material';

import { playgroundState } from 'state/playground';

import FormInput, { TFormInput, TFormInputValue } from '../FormInput';

type Schema = {
  [key: string]: yup.Schema;
};

const ModelSettings = () => {
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const isChat = !!playground?.prompt?.messages;

  const providers = playground?.providers
    ? playground.providers.filter((p) => p.is_chat === isChat)
    : [];

  if (!providers) {
    throw new Error('No LLM provider available.');
  }

  let provider = providers.find(
    (provider) => provider.id === playground.prompt?.provider
  );

  const providerFound = !!provider;

  provider = provider || providers[0];

  const providerWarning = !providerFound ? (
    <Alert severity="warning">
      {playground?.prompt?.provider} provider is not found, using{' '}
      {provider.name} instead.
    </Alert>
  ) : null;

  const defaultSettings: { [key: string]: any } = {};
  let schema;

  if (provider?.inputs) {
    schema = yup.object(
      provider.inputs.reduce((object: Schema, input: TFormInput) => {
        defaultSettings[input.id] = input.initial;

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
  }

  const formik = useFormik({
    initialValues:
      (providerFound && playground?.prompt?.settings) || defaultSettings,
    validationSchema: schema,
    onSubmit: async () => undefined
  });

  useEffect(() => {
    setPlayground((old) =>
      merge(cloneDeep(old), {
        prompt: {
          provider: provider?.id,
          settings: formik.values
        }
      })
    );
  }, [formik.values]);

  return (
    <Stack
      spacing={2}
      sx={{
        marginLeft: '32px !important'
      }}
    >
      <Typography fontSize="16px" fontWeight={600} color="text.primary">
        Settings
      </Typography>
      {providerWarning}
      {provider.inputs.map((input: TFormInput) => (
        <FormInput
          key={input.id}
          element={{
            ...input,
            value: formik.values[input.id],
            onChange: (event: any): void => {
              formik.handleChange(event);
            },
            setField: (
              field: string,
              value: TFormInputValue,
              shouldValidate?: boolean
            ): void => {
              formik.setFieldValue(field, value, shouldValidate);
            }
          }}
        />
      ))}
    </Stack>
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
    <ModelSettings />
  ) : (
    <Drawer
      sx={{
        '& .MuiDrawer-paper': {
          alignItems: 'center',
          width: '300px'
        }
      }}
      variant="persistent"
      anchor="right"
      open={isDrawerOpen}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          paddingRight: '30px',
          paddingTop: '10px'
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
      {<ModelSettings />}
    </Drawer>
  );
}
