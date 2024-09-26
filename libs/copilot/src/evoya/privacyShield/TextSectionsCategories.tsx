import {
  Stack,
  Box,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlined from '@mui/icons-material/EditOutlined';

import { TextSection } from 'evoya/types';

import { usePrivacyShield } from './usePrivacyShield';

import { Translator } from '@chainlit/app/src/components/i18n';

interface Props {
  setActiveSection: (id: string) => void;
  createSectionAction: () => void;
  editSectionAction: (section: TextSection) => void;
  activeSection: string;
}

const TextSectionsCategories = ({ setActiveSection, createSectionAction, editSectionAction, activeSection }: Props): JSX.Element => {
  const {
    setSectionAnon,
    categories,
    removeSection,
  } = usePrivacyShield();

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,
        width: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 3,
      }}
    >
      <Box
        sx={{
          overflow: 'auto',
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        {Object.keys(categories).map((categoryKey, index) => (
          <Box
            sx={{
              marginTop: index > 0 ? 3 : 0,
            }}
          >
            <Box
              sx={(theme) => ({
                color: theme.palette.primary.main,
                borderBottom: `1px solid ${theme.palette.grey[300]}`,
                fontWeight: 'bold',
                paddingBottom: 1
              })}
            >
              {categoryKey.toUpperCase()}
            </Box>
            <Stack>
              {categories[categoryKey].map((section) => (
                <Box
                  sx={(theme) => ({
                    backgroundColor: activeSection === section.id ? theme.palette.grey[200] : 'transparent',
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                    padding: 1,
                    paddingRight: 0,
                  })}
                  onMouseEnter={() => setActiveSection(section.id)}
                  onMouseLeave={() => setActiveSection('')}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr) 72px',
                      alignItems: 'center'
                    }}
                  >
                    <Box
                      onClick={section.isLocked ? () => {} : () => setSectionAnon(section.id, true)}
                    >
                      {section.isAnon ? (
                        <Chip
                          key={section.id}
                          label={section.anonString}
                          color='success'
                          variant="outlined"
                        />
                      ) : (
                        section.anonString
                      )}
                    </Box>
                    <Box
                      onClick={section.isLocked ? () => {} : () => setSectionAnon(section.id, false)}
                    >
                      {!section.isAnon ? (
                        <Chip
                          key={section.id}
                          label={section.string}
                          color='error'
                          variant="outlined"
                        />
                      ) : (
                        section.string
                      )}
                    </Box>
                    <Stack direction="row" gap={1} pl={1}>
                      {!section.isLocked && (
                        <>
                          <IconButton size="small" onClick={() => editSectionAction(section)}>
                            <EditOutlined fontSize="inherit" />
                          </IconButton>
                          <IconButton size="small" onClick={() => removeSection(section.id)}>
                            <CloseIcon fontSize="inherit" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          padding: 2
        }}
      >
        <Button startIcon={<AddIcon />} onClick={createSectionAction}>
          <Translator path="components.organisms.privacyShield.actions.createSection" />
        </Button>
      </Box>
    </Box>
  )
}

export default TextSectionsCategories;