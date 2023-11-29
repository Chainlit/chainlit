import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useFormik } from 'formik';
import { useContext } from 'react';
import { AccentButton } from 'src/buttons';
import { TextInput } from 'src/inputs';
import { grey } from 'theme';
import * as yup from 'yup';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const FunctionModal = (): JSX.Element | null => {
  const { setPlayground, playground, functionIndex, setFunctionIndex } =
    useContext(PlaygroundContext);

  const theme = useTheme();
  const hasIndex = functionIndex !== undefined;
  const functions = playground?.generation?.functions || [];
  const fn = hasIndex ? functions[functionIndex] : undefined;

  const updateFunction = (name: string, description: string) => {
    if (functionIndex !== undefined && fn) {
      const nextFn = { ...fn, name, description };
      setPlayground((old) => {
        if (!old?.generation) return old;

        return {
          ...old,
          generation: {
            ...old.generation,
            functions: [
              ...functions.slice(0, functionIndex),
              nextFn,
              ...functions.slice(functionIndex + 1)
            ]
          }
        };
      });
      setFunctionIndex(undefined);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: fn?.name,
      description: fn?.description
    },
    validationSchema: yup.object({
      name: yup.string().required(),
      description: yup.string().required()
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      updateFunction(values.name!, values.description!);
    }
  });

  return (
    <Dialog
      id="function-modal"
      open={!!fn}
      onClose={() => setFunctionIndex(undefined)}
      fullWidth
      maxWidth="md"
      sx={{
        border: (theme) =>
          theme.palette.mode === 'dark' ? `1px solid ${grey[800]}` : null,
        borderRadius: 1
      }}
    >
      <Box bgcolor="background.paper">
        <DialogTitle>
          <Typography fontSize="16px" fontWeight={700} color="text.secondary">
            {`Edit function ${fn?.name}`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2}>
            <TextInput
              id="fn-name"
              label="Function name"
              onChange={(e) => formik.setFieldValue('name', e.target.value)}
              value={formik.values['name']}
              hasError={!!formik.errors.name}
            />
            <TextInput
              id="fn-desc"
              label="Function description"
              multiline
              onChange={(e) =>
                formik.setFieldValue('description', e.target.value)
              }
              value={formik.values['description']}
              hasError={!!formik.errors.description}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: theme.spacing(0, 3, 2) }}>
          <AccentButton
            id="edit-function"
            variant="outlined"
            onClick={() => formik.submitForm()}
          >
            Save
          </AccentButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default FunctionModal;
