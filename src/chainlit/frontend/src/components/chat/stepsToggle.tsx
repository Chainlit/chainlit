import { useRecoilValue, useSetRecoilState } from "recoil";
import { displayStepsState } from "state/chat";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { Typography } from "@mui/material";
import { SxProps } from "@mui/system";

interface Props {
  sx?: SxProps;
}

const StepsToggle = ({ sx }: Props) => {
  const display = useRecoilValue(displayStepsState);
  const setDisplay = useSetRecoilState(displayStepsState);

  return (
    <FormControlLabel
      sx={sx}
      control={
        <Switch
          checked={display}
          onChange={(e) => setDisplay(e.target.checked)}
        />
      }
      label={
        <Typography color="text.secondary" variant="caption">
          Display steps
        </Typography>
      }
    />
  );
};

export default StepsToggle;
