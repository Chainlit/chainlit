import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { playgroundSettingsState, playgroundState } from "state/chat";
import { useEffect, useState } from "react";
import {
  Editor,
  EditorState,
  ContentState,
  Modifier,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { OrderedSet } from "immutable";
import LoadingButton from "@mui/lab/LoadingButton";
import { Close, Restore } from "@mui/icons-material";
import ModelSettings from "./modelSettings";
import { getCompletion } from "api";

const styleMap = {
  COMPLETION: {
    backgroundColor: "#d2f4d3",
    color: "black",
  },
};

export default function Playground() {
  const theme = useTheme();
  const playground = useRecoilValue(playgroundState);
  const setPlayground = useSetRecoilState(playgroundState);
  const settings = useRecoilValue(playgroundSettingsState);
  const setPlaygroundSettings = useSetRecoilState(playgroundSettingsState);
  const [state, setState] = useState(EditorState.createEmpty());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playground?.prompt) {
      const _state = EditorState.createWithContent(
        ContentState.createFromText(playground.prompt)
      );
      setState(insertCompletion(_state, playground.completion));
    }
    if (playground?.llmSettings) {
      setPlaygroundSettings({ ...playground.llmSettings });
    }
  }, [playground]);

  const restore = () => {
    if (playground) {
      setPlayground({ ...playground });
    }
  };

  const insertCompletion = (state: EditorState, completion: string) => {
    const contentState = state.getCurrentContent();

    const blockMap = contentState.getBlockMap();
    const key = blockMap.last().getKey();
    const length = blockMap.last().getLength();
    const selection = new SelectionState({
      anchorKey: key,
      anchorOffset: length,
      focusKey: key,
      focusOffset: length,
    });

    const ncs = Modifier.insertText(
      contentState,
      selection,
      "\n" + completion,
      OrderedSet.of("COMPLETION")
    );
    const es = EditorState.push(state, ncs, "insert-characters");
    return EditorState.forceSelection(es, ncs.getSelectionAfter());
  };

  const handleClose = () => {
    setPlayground(undefined);
  };

  const submit = async () => {
    if (!settings) {
      return;
    }
    const prompt = state.getCurrentContent().getPlainText();
    try {
      setLoading(true);
      const completion = await getCompletion(prompt, settings);
      setState(insertCompletion(state, completion));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!playground}
      fullScreen
      PaperProps={{
        style: {
          backgroundColor: theme.palette.background.default,
          backgroundImage: "none",
        },
      }}
      onClose={handleClose}
      aria-labelledby="playground"
      aria-describedby="playground"
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        <Typography fontSize="18px" fontWeight={700}>
          Prompt playground
        </Typography>
        <IconButton sx={{ ml: "auto" }} onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ overflowY: "scroll", flexGrow: 1 }}
        >
          <Box
            sx={{
              fontFamily: "Inter",
              fontSize: "16px",
              lineHeight: "24px",
              padding: "0.75rem",
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: "0.375rem",
              overflowY: "auto",
              width: "100%",
              flexGrow: 1,
              caretColor: (theme) => theme.palette.text.primary,
            }}
          >
            <Editor
              customStyleMap={styleMap}
              editorState={state}
              onChange={setState}
            />
          </Box>
          <ModelSettings />
        </Stack>
        <Stack direction="row" alignItems="center" mt={1} spacing={2}>
          <LoadingButton
            onClick={submit}
            variant="contained"
            sx={{ padding: "6px 12px", height: "35px" }}
            loading={loading}
          >
            Submit
          </LoadingButton>
          <Tooltip title="Restore original">
            <IconButton onClick={restore}>
              <Restore />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
