import { Alert, Box } from "@mui/material";
import Header from "components/header";
import { useRecoilValue } from "recoil";
import { projectSettingsState } from "state/project";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "hooks/auth";
import { userEnvState } from "state/user";

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isProjectMember, isAuthenticated, isLoading, role, accessToken } =
    useAuth();
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

  if (isPrivate && !accessToken) {
    return null;
  }

  if (isPrivate && role && !isProjectMember) {
    return <Alert severity="error">You are not part of this project.</Alert>;
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
      <Header />
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
