import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { authState } from "state/chat";

export default function Login() {
  const { loginWithRedirect, user } = useAuth0();
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth && !auth.anonymous && !user) {
      loginWithRedirect({
        authorizationParams: {
          audience: "chainlit-cloud"
        }
      });
    } else navigate("/");
  }, [auth, user]);

  return null;
}
