'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-xl font-semibold">Une erreur inattendue s'est produite</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message ?? 'Veuillez rafraîchir la page ou réessayer.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
