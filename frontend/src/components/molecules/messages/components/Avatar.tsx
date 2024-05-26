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
          width: '1.6rem',
          height: '1.6rem',
          bgcolor: 'transparent'
        }}
        src={hide ? undefined : url}
      />
    </span>
  );
};

export { MessageAvatar };
