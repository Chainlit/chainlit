import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import {
  MentionsInput,
  Mention,
  SuggestionDataItem,
} from "react-mentions-continued";
import { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { agentState, loadingState } from "state/chat";
import { inputStyle, mentionStyle } from "./style";
import AgentAvatar from "../agentAvatar";

interface Props {
  onSubmit: (message: string) => void;
}

const Input = ({ onSubmit }: Props) => {
  const ref = useRef<HTMLInputElement>();
  const loading = useRecoilValue(loadingState);
  const agents = useRecoilValue(agentState);
  const [value, setValue] = useState("");
  const theme = useTheme();

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  const submit = () => {
    if (value === "" || loading) {
      return;
    }
    onSubmit(value);
    setValue("");
  };

  const renderAgentSuggestionItem = (suggestion: any) => {
    const agent = agents?.find((a) => a.id === suggestion.id);
    if (!agent) {
      return null;
    }
    return (
      <ListItem>
        <ListItemAvatar>
          <AgentAvatar agent={agent.id} />
        </ListItemAvatar>
        <ListItemText
          primary={<Typography color="text.primary">{agent.id}</Typography>}
          // secondary={agent.description}
        />
      </ListItem>
    );
  };

  return (
    <MentionsInput
      inputRef={ref}
      style={inputStyle(theme)}
      placeholder="Type here..."
      singleLine
      forceSuggestionsAboveCursor
      value={value}
      onChange={(e: any) => setValue(e.target.value)}
      onKeyDown={(e: any) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <Mention
        style={mentionStyle(theme)}
        trigger="@"
        displayTransform={(id: string, display: string) => "@" + display}
        data={agents || []}
        renderSuggestion={renderAgentSuggestionItem}
      />
    </MentionsInput>
  );
};

export default Input;
