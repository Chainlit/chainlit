import { Box } from "@mui/material";
import TopBar from "components/topBar";
import { useAuth0 } from "@auth0/auth0-react";
import { useRecoilValue } from "recoil";
import { accessTokenState, projectSettingsState } from "state/chat";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const accessToken = useRecoilValue(accessTokenState);
  const { isAuthenticated, isLoading } = useAuth0();
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();

  const notAnonymous = pSettings && !pSettings.anonymous;

  useEffect(() => {
    if (notAnonymous && !isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [pSettings, isAuthenticated, isLoading]);

  if (notAnonymous && !accessToken) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <TopBar />
      {children}
    </Box>
  );
};

export default Page;
