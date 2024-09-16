import {
  Stack,
  Box,
} from '@mui/material';

import { usePrivacyShield } from './usePrivacyShield';

const TextSectionsCategoriesSimple = (): JSX.Element => {
  const {
    categories,
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
        position: "sticky",
        top: '1rem'
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
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                    padding: 1,
                    paddingRight: 0,
                  })}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      {section.anonString}
                    </Box>
                    <Box>
                      {section.string}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default TextSectionsCategoriesSimple;