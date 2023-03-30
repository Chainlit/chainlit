import { ChangeEventHandler, useRef } from "react";
import { styled } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";

import { debounce } from "lodash";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Close } from "@mui/icons-material";
import { useRecoilState } from "recoil";
import { datasetFiltersState } from "state/chat";

interface Props {}

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  color: theme.palette.text.primary,
  borderRadius: "4px",
  border: `${theme.palette.divider} solid 1px`,
  "&:hover": {
    border: `${theme.palette.primary} solid 1px !important`,
  },

  marginLeft: 0,
  display: "flex",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(3)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export default function SearchBar({}: Props) {
  const [df, setDf] = useRecoilState(datasetFiltersState);

  const handleChange = (value: string) => {
    value = value.trim();
    const search = value === "" ? undefined : value;
    setDf({ ...df, search });
  };

  const _onChange = debounce(handleChange, 300);
  const inputRef = useRef<HTMLInputElement>();

  const clear = () => {
    _onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Search>
      <SearchIconWrapper
        sx={{
          position: "absolute",
          pointerEvents: "none",
          height: "100%",
          paddingX: 1,
        }}
      >
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Search messages..."
        inputProps={{ "aria-label": "search", ref: inputRef }}
        onChange={(e) => _onChange(e.target.value)}
      />
      <SearchIconWrapper>
        <IconButton onClick={clear}>
          <Close />
        </IconButton>
      </SearchIconWrapper>
    </Search>
  );
}
