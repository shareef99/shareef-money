import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

// A chart dashboard renders many independent visualizations; a single bad data
// shape shouldn't blank the whole page. This contains render errors to one card.
export class ChartBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-40 items-center justify-center text-sm text-text-muted">
          Could not render this chart.
        </div>
      );
    }
    return this.props.children;
  }
}
