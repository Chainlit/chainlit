import { Component, ErrorInfo, ReactNode } from 'react';

import { Alert, Box } from '@mui/material';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box flexGrow={1}>
          <Alert severity="error">Something went wrong.</Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
