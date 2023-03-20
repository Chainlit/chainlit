import { Box, SxProps } from "@mui/material";
import Spreadsheet from "react-spreadsheet";
import "./table.css";

export interface ArtifactTableProps {
  cols: string[];
  rows: any[];
  sx?: SxProps;
}

const ArtifactTable = ({ cols, rows, sx }: ArtifactTableProps) => {
  const data = rows.map((r) => cols.map((c) => ({ value: r[c] })));
  if (!data.length) {
    return null;
  }
  return (
    <Box
      sx={{
        ...(sx || {}),
        overflow: "scroll",
      }}
    >
      <Spreadsheet hideRowIndicators columnLabels={cols} data={data} />
    </Box>
  );
};

export default ArtifactTable;
