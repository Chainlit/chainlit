import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { projectSettingsState } from "state/chat";

export default function Login() {
  const { loginWithRedirect, user } = useAuth0();
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();

  useEffect(() => {
    if (pSettings && !pSettings.anonymous && !user) {
      loginWithRedirect({
        authorizationParams: {
          audience: "chainlit-cloud"
        }
      });
    } else navigate("/");
  }, [pSettings, user]);

  return null;
}
