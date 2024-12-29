import { Component, ErrorInfo, ReactNode } from 'react';

import Alert from './Alert';

interface Props {
  prefix?: string;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined
  };

  public static getDerivedStateFromError(err: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: err.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const msg = this.props.prefix
        ? `${this.props.prefix}: ${this.state.error}`
        : this.state.error;
      return (
        <div className="flex-grow">
          <Alert variant="error">{msg}</Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
