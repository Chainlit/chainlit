import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { IMessageElement } from 'src/types/element';

import { Element } from './Element';

interface ElementViewProps {
  element: IMessageElement;
}

const ElementView = ({ element }: ElementViewProps) => (
  <Box
    display="flex"
    flexDirection="column"
    flexGrow={1}
    p={3}
    gap={2}
    boxSizing="border-box"
    mx="auto"
    sx={{
      width: '100%',
      maxWidth: '60rem',
      color: 'text.primary'
    }}
    id="element-view"
  >
    <Typography fontWeight={700} fontSize="25px">
      {element.name}
    </Typography>
    <Element element={element} />
  </Box>
);

export { ElementView, Element };
