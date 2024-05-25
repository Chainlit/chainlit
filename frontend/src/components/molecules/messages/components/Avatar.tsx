import { useRecoilValue } from 'recoil';

import Avatar from '@mui/material/Avatar';

import { apiClientState } from 'state/apiClient';

interface Props {
  author: string;
  hide?: boolean;
}

const MessageAvatar = ({ author, hide }: Props) => {
  const apiClient = useRecoilValue(apiClientState);
  const url = apiClient?.buildEndpoint(`/avatars/${author || 'default'}`);

  return (
    <span className={`message-avatar`}>
      <Avatar
        sx={{
          width: 30,
          height: 30,
          mt: '-2px',
          bgcolor: 'transparent'
        }}
        src={hide ? undefined : url}
      />
    </span>
  );
};

export { MessageAvatar };
