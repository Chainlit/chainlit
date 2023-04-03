import { Alert, Box } from "@mui/material";
import TopBar from "components/topBar";
import { useRecoilValue } from "recoil";
import {
  projectSettingsState,
  userEnvState,
} from "state/chat";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "hooks/auth";

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isProjectMember, isAuthenticated, isLoading, role } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();
  const userEnv = useRecoilValue(userEnvState);

  const isPrivate = pSettings && !pSettings.public;

  useEffect(() => {
    if (isPrivate && !isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [pSettings, isAuthenticated, isLoading]);

  useEffect(() => {
    if (pSettings?.userEnv) {
      for (const key of pSettings?.userEnv) {
        if (!userEnv[key]) navigate("/env");
      }
    }
  }, [pSettings, userEnv]);

  if (isPrivate && !isProjectMember) {
    return null;
  }

  const renderAnonymousWarning =
    !isPrivate && isAuthenticated && role === "ANONYMOUS";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <TopBar />
      {renderAnonymousWarning && (
        <Alert severity="info">
          You are currently logged in as an anonymous user. You will not be able
          to save any changes.
        </Alert>
      )}
      {children}
    </Box>
  );
};

export default Page;
