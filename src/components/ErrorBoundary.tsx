import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let isPermissionError = false;
      try {
        const errorJson = JSON.parse(this.state.error?.message || '{}');
        if (errorJson.error && errorJson.error.includes('Missing or insufficient permissions')) {
          isPermissionError = true;
        }
      } catch (e) {
        // Not JSON error
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">âš ï¸</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">
              {isPermissionError 
                ? "You don't have permission to perform this action. Please log in or check your account."
                : "An unexpected error occurred. We're looking into it."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              RELOAD PAGE
            </button>
            <button
               onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '/'; }}
               className="w-full mt-3 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
               BACK TO HOME
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
