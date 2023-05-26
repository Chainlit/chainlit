import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import { IconButton } from '@mui/material';
import { useRecoilState } from 'recoil';
import { themeState } from 'state/theme';

export default function ThemeButton() {
  const [themeVariant, setThemeVariant] = useRecoilState(themeState);

  return (
    <IconButton
      color="inherit"
      onClick={() => {
        const variant = themeVariant === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeVariant', variant);
        setThemeVariant(variant);
      }}
    >
      {themeVariant === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
    </IconButton>
  );
}
