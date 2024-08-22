import { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { Box } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

import { useChatInteract, useConfig, useChatData } from '@chainlit/react-client';

import { SelectInput } from 'components/atoms/inputs';

import { Assistant, assistantsState } from 'state/project';

export default function AssistantProfiles() {
  const { config } = useConfig();
  const { listAssistants, setSelectedAssistant } = useChatInteract();
  const [assistants, setAssistants] = useRecoilState(assistantsState);
  const [assistant, setAssistant] = useState<string>('');
  const { assistantSettingsInputs } = useChatData();

  const fetchAssistants = useCallback(async () => {
    try {
      const assistantsList = (await listAssistants()) as Assistant[];
      setAssistants(assistantsList);

      // Set initial assistant if available
      if (assistantsList.length > 0 && !assistant) {
        setAssistant(assistantsList[0].name);
        setSelectedAssistant(assistantsList[0].name);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
      setAssistants([]);
    }
  }, [listAssistants, setSelectedAssistant, assistant, setAssistants]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  if (typeof config === 'undefined' || !assistants || assistants.length === 0 || !assistantSettingsInputs || assistantSettingsInputs.length === 0) {
    return null;
  }

  const items = assistants.map((assistant) => ({
    label: assistant.name,
    value: assistant.name
  }));

  const handleChange = (e: SelectChangeEvent) => {
    setAssistant(e.target.value);
    setSelectedAssistant(e.target.value);
  };

  return (
    <Box>
      <SelectInput
        value={assistant}
        items={items}
        id="assistant-selector"
        onChange={handleChange}
        disabled={assistants.length === 0}
        placeholder="Select an assistant"
        onOpen={fetchAssistants}
      />
    </Box>
  );
}