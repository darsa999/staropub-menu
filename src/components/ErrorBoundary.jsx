import React from "react";

/**
 * Catches render errors so a single broken component doesn't blank the whole app.
 * Rendered outside the context providers, so its copy is static.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">რაღაც შეცდომა მოხდა / Something went wrong</h1>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold"
        >
          გვერდის გადატვირთვა / Reload
        </button>
      </div>
    );
  }
}
