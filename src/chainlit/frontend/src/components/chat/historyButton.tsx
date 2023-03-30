import { History } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { historyOpenedState, projectSettingsState } from "state/chat";
import CloudProvider from "components/cloudProvider";
import { memo, useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";

const ConversationsQuery = gql`
  query ($first: Int, $projectId: String!, $authorEmail: String) {
    conversations(
      first: $first
      projectId: $projectId
      authorEmail: $authorEmail
    ) {
      edges {
        cursor
        node {
          id
          createdAt
          messages {
            content
          }
        }
      }
    }
  }
`;

interface Props {
  onClick: (content: string) => void;
}

function _HistoryButton({ onClick }: Props) {
  const { user } = useAuth0();
  const pSettings = useRecoilValue(projectSettingsState);
  const [open, setOpen] = useRecoilState(historyOpenedState);
  const ref = useRef<any>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data, loading, error, refetch } = useQuery(ConversationsQuery, {
    variables: {
      first: 10,
      projectId: pSettings?.projectId,
      authorEmail: user?.email,
    },
  });

  useEffect(() => {
    if (open) {
      if (ref.current) {
        setAnchorEl(ref.current);
        refetch();
      }
    }
  }, [open]);

  const conversations = data?.conversations.edges.map((e: any) => e.node);
  const history: Record<
    string,
    {
      id: number;
      hour: string;
      content: string;
    }[]
  > = {};

  conversations?.forEach((c: any) => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const date = new Date(c.createdAt).toLocaleDateString(
      undefined,
      dateOptions
    );
    if (!history[date]) {
      history[date] = [];
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
    };
    history[date].push({
      id: c.id,
      hour: new Date(c.createdAt).toLocaleTimeString(undefined, timeOptions),
      content: c.messages[0].content,
    });
  });

  const menuEls: JSX.Element[] = [];

  Object.keys(history).forEach((date) => {
    menuEls.push(
      //@ts-ignore
      <div key={date} disabled>
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "16px 12px",
            textTransform: "uppercase",
          }}
        >
          {date}
        </Typography>
      </div>
    );

    history[date].forEach((h) => {
      menuEls.push(
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(false);
            onClick(h.content);
          }}
          disableRipple
          key={h.id}
          sx={{ p: 2, alignItems: "baseline" }}
        >
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 700,
              flexBasis: "64px",
            }}
          >
            {h.hour}
          </Typography>
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              maxHeight: "50px",
              display: "-webkit-box",
              WebkitLineClamp: "2",
              WebkitBoxOrient: "vertical",
              flexBasis: "calc(100% - 60px)",
              flexGrow: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "24px",
            }}
          >
            {h.content}
          </Typography>
        </MenuItem>
      );
    });
  });

  const menu = (
    <Menu
      autoFocus
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        elevation: 0,
        sx: {
          mt: -2,
          overflow: "visible",
          maxHeight: "60vh",
          maxWidth: "280px",
          overflowY: "scroll",
        },
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      {menuEls}
    </Menu>
  );

  return (
    <div>
      {menu}
      <Tooltip title="Show history">
        <IconButton
          color="inherit"
          disabled={!conversations}
          onClick={(e) => setOpen(!open)}
          ref={ref}
        >
          <History />
        </IconButton>
      </Tooltip>
    </div>
  );
}

export default memo(function HistoryButton({ onClick }: Props) {
  return (
    <CloudProvider>
      <_HistoryButton onClick={onClick} />
    </CloudProvider>
  );
});
