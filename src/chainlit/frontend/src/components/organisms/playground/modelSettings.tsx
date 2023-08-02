import { useFormik } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { useRecoilState } from 'recoil';
import * as yup from 'yup';

import { Alert, Stack, Typography } from '@mui/material';

import { playgroundState } from 'state/playground';

import FormInput, { TFormInput, TFormInputValue } from '../FormInput';

type Schema = {
  [key: string]: yup.Schema;
};

type InputEvent = {
  name: string;
  value: TFormInputValue;
};

const ModelSettings = () => {
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const isChat = !!playground?.prompt?.messages;

  const providers = playground?.providers
    ? playground.providers.filter((p) => p.is_chat === isChat)
    : [];

  if (!providers) {
    return <Alert severity="error">No LLM provider available.</Alert>;
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

  const updatePlayground = (input: InputEvent) => {
    setPlayground((old) =>
      merge(cloneDeep(old), {
        provider: { inputs: input }
      })
    );
  };

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
              updatePlayground({ name: input.id, value: input.value });
            },
            setField: (
              field: string,
              value: TFormInputValue,
              shouldValidate?: boolean
            ): void => {
              formik.setFieldValue(field, value, shouldValidate);
              updatePlayground({ name: input.id, value: input.value });
            }
          }}
        />
      ))}
    </Stack>
  );
};

export default ModelSettings;
