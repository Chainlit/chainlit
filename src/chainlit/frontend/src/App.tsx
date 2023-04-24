import { Box } from "@mui/material";
import "./App.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { accessTokenState, roleState } from "state/user";
import { getProjectSettings, getRole } from "api";
import theme from "theme";
import { ThemeProvider } from "@mui/material";
import { themeState } from "state/theme";
import Home from "pages/Home";
import Element from "pages/Element";
import Login from "pages/Login";
import AuthCallback from "pages/AuthCallback";
import { Socket } from "socket.io-client";
import Dataset from "pages/Dataset";
import Conversation from "pages/Conversation";
import CloudProvider from "components/cloudProvider";
import Env from "pages/Env";
import { useAuth } from "hooks/auth";
import { projectSettingsState } from "state/project";

declare global {
  interface Window {
    socket: Socket | undefined;
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/env",
    element: <Env />,
  },
  {
    path: "/conversations/:id",
    element: (
      <CloudProvider>
        <Conversation />
      </CloudProvider>
    ),
  },
  {
    path: "/dataset",
    element: <Dataset />,
  },
  {
    path: "/element/:name",
    element: <Element />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/api/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
]);

function App() {
  const themeVariant = useRecoilValue(themeState);

  const [pSettings, setPSettings] = useRecoilState(projectSettingsState);
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const setRole = useSetRecoilState(roleState);
  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth();

  useEffect(() => {
    if (pSettings === undefined) {
      getProjectSettings().then((res) => setPSettings(res));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken === undefined) {
      getAccessTokenSilently({
        authorizationParams: {
          audience: "chainlit-cloud",
        },
      })
        .then((token) => setAccessToken(token))
        .catch((err) => {
          console.error(err);
          logout({
            logoutParams: {
              returnTo: window.location.origin,
            },
          });
        });
    }
  }, [isAuthenticated, getAccessTokenSilently, accessToken, setAccessToken]);

  useEffect(() => {
    if (!accessToken || !pSettings?.projectId) {
      return;
    }
    getRole(pSettings.chainlitServer, accessToken, pSettings.projectId)
      .then(async ({ role }: any) => {
        setRole(role);
      })
      .catch((err) => {
        console.log(err);
        setRole("ANONYMOUS");
      });
  }, [accessToken, pSettings]);

  if (pSettings === undefined) {
    return null;
  }

  return (
    <ThemeProvider theme={theme(themeVariant)}>
      <Box
        display="flex"
        bgcolor="background.default"
        height="100vh"
        width="100vw"
      >
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
