import { Tooltip } from "@mui/material";
import Avatar from "@mui/material/Avatar";

interface Props {
  agent: string;
}

function onlyCapitalLetters(str: string) {
  return str.replace(/[^A-Z]+/g, "").slice(0, 2);
}

function stringToHslColor(str: string, s: number, l: number) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  var h = hash % 360;
  return "hsl(" + h + ", " + s + "%, " + l + "%)";
}

export const getAgentColor = (agent: string) => stringToHslColor(agent, 50, 70)

const AgentAvatar = ({ agent }: Props) => {
  const children = onlyCapitalLetters(agent);

  return (
    <Tooltip title={agent}>
      <Avatar
        sx={{
          height: "30px",
          width: "30px",
          borderRadius: "0.125rem",
          bgcolor: getAgentColor(agent),
          color: "black",
          fontSize: "1em",
        }}
      >
        {children}
      </Avatar>
    </Tooltip>
  );
};

export default AgentAvatar;
