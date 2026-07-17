import React from "react";
import { themeColors } from "../styles";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            background: themeColors.panelSurface,
            border: `1px solid ${themeColors.danger}`,
            borderRadius: "14px",
            color: themeColors.textPrimary,
            marginTop: "1rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: themeColors.danger, fontFamily: "'Lora', serif" }}>
            Feature Temporarily Unavailable
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: themeColors.textSecondary }}>
            We encountered an error loading this feature. The rest of MindVault is still running normally.
          </p>
          {this.state.error && (
            <pre
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "#1A1A1A",
                border: `1px solid ${themeColors.borderDivider}`,
                borderRadius: "8px",
                color: themeColors.danger,
                fontSize: "0.8rem",
                overflowX: "auto",
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: themeColors.accentPrimary,
              color: themeColors.bgBase,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem"
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
