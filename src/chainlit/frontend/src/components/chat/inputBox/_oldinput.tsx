import SendIcon from "@mui/icons-material/Send";
import { IconButton, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { historyOpenedState, loadingState } from "state/chat";
import HistoryButton from "components/chat/historyButton";

interface Props {
  onSubmit: (message: string) => void;
}

const borderWidth = 0;
const borderColor = "transparent";

const Input = ({ onSubmit }: Props) => {
  const ref = useRef<any>();
  const hSetOpen = useSetRecoilState(historyOpenedState);
  const loading = useRecoilValue(loadingState);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (ref.current && !loading) {
      ref.current.querySelector("input")?.focus();
    }
  }, [loading]);


  const submit = useCallback(() => {
    if (value === "" || loading) {
      return;
    }
    onSubmit(value);
    setValue("");
  }, [value, loading, setValue, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "ArrowUp") {
        hSetOpen(true);
      }
    },
    [submit, hSetOpen]
  );

  const onHistoryClick = useCallback((content: string) => {
    if (ref.current) {
      setValue(content);
    }
  }, []);

  return (
    <TextField
      ref={ref}
      autoFocus
      variant="standard"
      autoComplete="false"
      placeholder="Type your message here..."
      disabled={loading}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      value={value}
      fullWidth
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <InputAdornment sx={{ ml: 1, color: "text.secondary" }} position="start">
            <HistoryButton onClick={onHistoryClick} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{ mr: 1, color: "text.secondary" }}
          >
            <IconButton
              disabled={loading}
              color="inherit"
              onClick={() => submit()}
            >
              <SendIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 1,

        input: {
          height: "27px",
          paddingBottom: "0.75rem",
          paddingTop: "0.75rem",
          color: "text.primary",
        },
        fieldset: {
          borderRadius: 1,
          borderWidth,
          borderColor: borderColor,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderWidth,
          borderColor: borderColor,
        },
        "&:focus .MuiOutlinedInput-notchedOutline": {
          borderWidth,
          borderColor: borderColor,
        },
        "&:active .MuiOutlinedInput-notchedOutline": {
          borderWidth,
          borderColor: borderColor,
        },
      }}
    />
  );
};

export default Input;
