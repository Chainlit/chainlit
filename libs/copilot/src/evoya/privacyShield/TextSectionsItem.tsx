import {
  Box,
  Chip,
} from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';

import { TextSection } from 'evoya/types';

interface Props {
  section: TextSection;
  isActive: boolean;
  setActive: (id: string) => void;
  setEdit: (section: TextSection) => void;
  toggleAnon: (id: string) => void;
}

const TextSectionsItem = ({ section, isActive, setActive, toggleAnon, setEdit }: Props): JSX.Element => {
  const style = section.isAnon ? 'success' : 'error';

  const mouseEnter = () => {
    if (section.id) {
      setActive(section.id);
    }
  }
  const mouseLeave = () => {
    setActive('');
  }
  const click = () => {
    if (section.id) {
      toggleAnon(section.id);
    }
  }
  const edit = () => {
    setEdit(section);
  }

  return (
    <Box
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      sx={{
        display: 'inline',
        cursor: 'pointer'
      }}
    >
      <Chip
        key={section.id}
        label={section.isAnon ? section.anonString : section.string}
        color={style}
        variant={isActive ? "filled" : "outlined"}
        size="small"
        onClick={click}
        onDelete={edit}
        deleteIcon={<EditOutlined />}
        sx={(theme) => ({
          border: `1px solid ${theme.palette[style].main}`,
          '&:hover': {
            border: `1px solid ${theme.palette[style].dark}`,
            // borderColor: theme.palette.info.main,
            // color: theme.palette.info.main,
            '.MuiSvgIcon-root': {
              // color: theme.palette.info.main,
              visibility: 'visible'
            },
            '.MuiChip-label': {
              transform: 'translateX(0px)'
            }
          },
          '.MuiSvgIcon-root': {
            visibility: 'hidden',
            marginRight: '4px'
          },
          '.MuiChip-label': {
            transform: 'translateX(8px)'
          }
        })}
      />
    </Box>
  );
}

export default TextSectionsItem;