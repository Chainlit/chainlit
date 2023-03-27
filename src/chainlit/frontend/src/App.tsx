import { Box } from "@mui/material";
import "./App.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { authState, accessTokenState } from "state/chat";
import { getAuth } from "api";
import theme from "theme";
import { ThemeProvider } from "@mui/material";
import { themeState } from "state/theme";
import { useAuth0 } from "@auth0/auth0-react";
import Home from "pages/Home";
import Document from "pages/Document";
import Login from "pages/Login";
import AuthCallback from "pages/AuthCallback";
import { Socket } from "socket.io-client";

declare global {
  interface Window {
    socket: Socket | undefined
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/document/:name",
    element: <Document />,
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

  const [auth, setAuth] = useRecoilState(authState);
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (auth === undefined) {
      getAuth().then((res) => setAuth(res));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken === undefined) {
      getAccessTokenSilently({
        authorizationParams: {
          audience: "chainlit-cloud"
        }
      }).then((token) => setAccessToken(token));
    }
  }, [isAuthenticated, getAccessTokenSilently, accessToken, setAccessToken]);

  if (auth === undefined) {
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
