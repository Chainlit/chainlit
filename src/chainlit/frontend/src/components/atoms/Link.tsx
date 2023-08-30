import React from 'react';
import { Link as RRLink, LinkProps as RRLinkProps } from 'react-router-dom';

import { Link as MLink, LinkProps as MLinkProps } from '@mui/material';

type LinkProps = {
  children: React.ReactNode;
} & RRLinkProps &
  MLinkProps;

const Link = ({ children, ...rest }: LinkProps): JSX.Element => {
  return (
    <MLink component={RRLink} {...rest}>
      {children}
    </MLink>
  );
};

export default Link;
