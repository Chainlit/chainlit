import { Box } from '@mui/material';
import './App.css';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider
} from 'react-router-dom';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { accessTokenState, roleState } from 'state/user';
import makeTheme from 'theme';
import { ThemeProvider } from '@mui/material';
import Home from 'pages/Home';
import Element from 'pages/Element';
import Login from 'pages/Login';
import AuthCallback from 'pages/AuthCallback';
import Dataset from 'pages/Dataset';
import Conversation from 'pages/Conversation';
import Env from 'pages/Env';
import { useAuth } from 'hooks/auth';
import Socket from 'components/socket';
import { Toaster } from 'react-hot-toast';
import Readme from 'pages/Readme';
import { settingsState } from 'state/settings';
import SettingsModal from 'components/settingsModal';
import Hotkeys from 'components/Hotkeys';
import { clientState } from 'state/client';
import Page from 'pages/Page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/readme',
    element: <Readme />
  },
  {
    path: '/env',
    element: <Env />
  },
  {
    path: '/conversations/:id',
    element: (
      <Page>
        <Conversation />
      </Page>
    )
  },
  {
    path: '/dataset',
    element: <Dataset />
  },
  {
    path: '/element/:id',
    element: <Element />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/api/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '*',
    element: <Navigate replace to="/" />
  }
]);

function App() {
  const client = useRecoilValue(clientState);
  const { theme: themeVariant } = useRecoilValue(settingsState);
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const setRole = useSetRecoilState(roleState);
  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth();
  const theme = makeTheme(themeVariant);

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && accessToken === undefined) {
      getAccessTokenSilently({
        authorizationParams: {
          audience: 'chainlit-cloud'
        }
      })
        .then((token) => setAccessToken(token))
        .catch((err) => {
          console.error(err);
          logout({
            logoutParams: {
              returnTo: window.location.origin
            }
          });
        });
    }
  }, [isAuthenticated, getAccessTokenSilently, accessToken, setAccessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    client.setAccessToken(accessToken);
    client
      .getRole()
      .then(async (role) => {
        setRole(role);
      })
      .catch((err) => {
        console.log(err);
        setRole('ANONYMOUS');
      });
  }, [accessToken]);

  return (
    <ThemeProvider theme={theme}>
      <Toaster
        toastOptions={{
          className: 'toast',
          style: {
            fontFamily: 'Inter',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0px 2px 4px 0px #0000000D'
                : '0px 10px 10px 0px #0000000D'
          }
        }}
      />
      <Box display="flex" height="100vh" width="100vw">
        <Socket />
        <Hotkeys />
        <SettingsModal />
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
