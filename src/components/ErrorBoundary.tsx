import React, { type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4 bg-white border border-rose-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-rose-600">
                Something went wrong
              </h2>
              <p className="text-sm text-[#64748B]">
                {this.state.error?.message ?? "An unexpected error occurred."}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
