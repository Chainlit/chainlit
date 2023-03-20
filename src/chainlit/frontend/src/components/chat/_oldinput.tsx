import { Send } from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { loadingState } from "state/chat";

const borderColor = "rgba(32,33,35,.5) !important";
const borderWidth = "1px !important";
const boxShadow = "0 0 transparent, 0 0 transparent,0 0 10px rgba(0,0,0,.1)";

interface Props {
  onSubmit: (message: string) => void;
}

const Input = ({ onSubmit }: Props) => {
  const loading = useRecoilValue(loadingState);
  const [value, setValue] = useState("");
  const submit = () => {
    if (value === "" || loading) {
      return;
    }
    onSubmit(value);
    setValue("");
  };

  return (
    <TextField
      autoComplete="false"
      variant="outlined"
      disabled={loading}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
      value={value}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{
              color: "rgba(142,142,160,1)",
            }}
          >
            <IconButton
              disabled={loading}
              color="inherit"
              onClick={() => submit()}
            >
              <Send />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        backgroundColor: "background.paper",
        borderRadius: ".375rem",
        boxShadow,
        input: {
          height: "27px",
          paddingLeft: "1rem",
          paddingBottom: "0.75rem",
          paddingTop: "0.75rem",
          color: "text.primary",
          fontFamily: "Inter",
        },
        fieldset: {
          borderRadius: ".375rem",
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
