import { useFormik } from 'formik';
import { MuiChipsInput } from 'mui-chips-input';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import * as yup from 'yup';

import { Box, Stack } from '@mui/material';

import InputLabel from 'components/inputLabel';
import SelectCategoryInput from 'components/selectCategoryInput';
import Slider from 'components/slider';

import { ILLMSettings } from 'state/chat';
import { playgroundState } from 'state/playground';

const models = {
  GPT4: ['gpt-4'],
  'Chat GPT': ['gpt-3.5-turbo'],
  GPT3: ['text-davinci-003', 'text-davinci-002']
};

const ModelSettings = () => {
  const [prompt, setPrompt] = useRecoilState(playgroundState);

  const schema = yup.object({
    model_name: yup.string(),
    stop: yup.array().of(yup.string()),
    temperature: yup.number().min(0).max(1),
    top_p: yup.number().min(0).max(1),
    frequency_penalty: yup.number().min(0).max(1),
    presence_penalty: yup.number().min(0).max(1)
  });

  const settings = prompt?.llm_settings;

  const formik = useFormik({
    initialValues: settings || ({} as ILLMSettings),
    validationSchema: schema,
    onSubmit: async () => undefined
  });

  useEffect(() => {
    if (settings) {
      formik.setValues(settings);
    }
  }, [settings]);

  useEffect(() => {
    setPrompt((old) => ({ ...old, llm_settings: formik.values }));
  }, [formik.values]);

  const modelSelect = (
    <SelectCategoryInput
      label="Model"
      size="small"
      name="model_name"
      value={formik.values.model_name}
      onChange={formik.handleChange}
      id={'model_name'}
      items={Object.entries(models).map(([category, models]) => {
        const header = category;
        const items = models.map((item) => ({ value: item, label: item }));
        return { header, items };
      })}
    />
  );

  const temperature = (
    <Slider
      label="Temperature"
      name="temperature"
      value={formik.values.temperature}
      onChange={formik.handleChange}
      min={0}
      max={1}
      step={0.1}
    />
  );

  const stopSequences = (
    <Box>
      <InputLabel label="Stop sequences" />
      <MuiChipsInput
        sx={{ mt: 1 }}
        size="small"
        placeholder=""
        value={
          Array.isArray(formik.values.stop)
            ? formik.values.stop
            : [formik.values.stop]
        }
        onChange={(value) => formik.setFieldValue('stop', value)}
      />
    </Box>
  );

  const topP = (
    <Slider
      label="Top P"
      name="top_p"
      value={formik.values.top_p}
      onChange={formik.handleChange}
      min={0}
      max={1}
      step={0.1}
    />
  );

  const frequencyPenalty = (
    <Slider
      label="Frequency penalty"
      name="frequency_penalty"
      value={formik.values.frequency_penalty}
      onChange={formik.handleChange}
      min={0}
      max={1}
      step={0.1}
    />
  );

  const presencePenalty = (
    <Slider
      label="Presence penalty"
      name="presence_penalty"
      value={formik.values.presence_penalty}
      onChange={formik.handleChange}
      min={0}
      max={1}
      step={0.1}
    />
  );

  return (
    <Stack spacing={2} sx={{ width: '250px' }}>
      {modelSelect}
      {temperature}
      {stopSequences}
      {topP}
      {frequencyPenalty}
      {presencePenalty}
    </Stack>
  );
};

export default ModelSettings;
