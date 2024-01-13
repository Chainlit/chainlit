import debounce from 'lodash/debounce';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { grey } from '@chainlit/react-components';

import { threadsFiltersState } from 'state/threads';

export default function SearchBar() {
  const [filters, setFilters] = useRecoilState(threadsFiltersState);

  const { t } = useTranslation();

  const handleChange = (value: string) => {
    value = value.trim();
    const search = value === '' ? undefined : value;
    setFilters((prev) => ({ ...prev, search }));
  };

  const _onChange = debounce(handleChange, 300);
  const inputRef = useRef<HTMLInputElement>();

  const clear = () => {
    _onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <TextField
      variant="standard"
      sx={{
        width: '100%',
        border: 'none',
        borderRadius: 1,
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? grey[850] : 'grey.100'
      }}
      InputProps={{
        sx: {
          px: 1.5,
          py: 1
        },
        disableUnderline: true,
        startAdornment: (
          <InputAdornment
            position="end"
            sx={{ color: 'text.secondary', mr: 1, ml: 0 }}
          >
            <SearchIcon sx={{ height: 20, width: 20 }} />
          </InputAdornment>
        ),
        endAdornment: filters.search ? (
          <IconButton onClick={clear} sx={{ p: '2px' }}>
            <CloseIcon sx={{ height: 18, width: 18 }} />
          </IconButton>
        ) : null
      }}
      placeholder={t(
        'components.organisms.threadHistory.sidebar.filters.SearchBar.search'
      )}
      inputProps={{
        'aria-label': 'search',
        ref: inputRef,
        sx: { p: 0 }
      }}
      onChange={(e) => _onChange(e.target.value)}
    />
  );
}
