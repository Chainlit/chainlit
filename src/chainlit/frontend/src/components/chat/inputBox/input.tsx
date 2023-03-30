import {
  Box,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { MentionsInput, Mention } from "react-mentions-continued";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { agentState, historyOpenedState, loadingState } from "state/chat";
import { inputStyle, mentionStyle } from "./style";
import AgentAvatar from "../agentAvatar";
import HistoryButton from "components/chat/historyButton";

interface Props {
  onSubmit: (message: string) => void;
}

const Input = ({ onSubmit }: Props) => {
  const ref = useRef<HTMLInputElement>();
  const hSetOpen = useSetRecoilState(historyOpenedState);
  const loading = useRecoilValue(loadingState);
  const agents = useRecoilValue(agentState);
  const [value, setValue] = useState("");
  const theme = useTheme();

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  const submit = useCallback(() => {
    if (value === "" || loading) {
      return;
    }
    onSubmit(value);
    setValue("");
  }, [value, loading, onSubmit]);

  const renderAgentSuggestionItem = useCallback((suggestion: any) => {
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
  }, []);

  const onHistoryClick = useCallback((content: string) => {
    if (ref.current) {
      setValue(content);
      window.requestAnimationFrame(() => {
        ref.current!.focus();
      });
    }
  }, []);

  return (
    <Box
      display="flex"
      alignItems="center"
      bgcolor="background.paper"
      borderRadius={1}
    >
      <HistoryButton onClick={onHistoryClick} />
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
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            hSetOpen(true);
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
    </Box>
  );
};

export default Input;
