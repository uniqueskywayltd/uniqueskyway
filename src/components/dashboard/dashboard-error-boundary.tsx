"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; fallbackTitle?: string };

type State = { hasError: boolean };

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-16 text-center"
          role="alert"
        >
          <AlertTriangle className="mb-4 h-8 w-8 text-destructive" />
          <h3 className="text-base font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This section failed to load. Try again or refresh the page.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
