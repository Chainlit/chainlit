import { Box } from "@mui/material";
import TopBar from "components/topBar";
import { useAuth0 } from "@auth0/auth0-react";
import { useRecoilValue } from "recoil";
import { accessTokenState, authState } from "state/chat";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const accessToken = useRecoilValue(accessTokenState);
  const { isAuthenticated, isLoading } = useAuth0();
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();

  const notAnonymous = auth && !auth.anonymous;

  useEffect(() => {
    if (notAnonymous && !isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [auth, isAuthenticated, isLoading]);

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
