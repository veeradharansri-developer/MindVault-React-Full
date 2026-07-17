// Premium Dark Mode Gold/Amber Theme Design System (Apple / Vercel style in Dark Mode)

export const themeColors = {
  bgBase: "#121212",
  panelSurface: "#1A1A1A",
  panelSurfaceRaised: "#222222",
  borderDivider: "#2A2A2A",
  accentPrimary: "#C9A227",          // Premium Gold
  highlightAmber: "#C9A227",         // Premium Gold
  textPrimary: "#F2F2F0",
  textSecondary: "#8A8A8A",          // Muted Silver Gray
  success: "#10B981",
  danger: "#EF4444",
  dangerAdminBadge: "#4A2020",
  confidenceHigh: "#10B981",
  confidenceMedium: "#F59E0B",
  confidenceLow: "#EF4444",
  badgeViolet: "#2D2D2D",
  badgeAmber: "#3A331A",
};

export const typography = {
  heading: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  body: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "400",
    color: themeColors.textPrimary,
  },
  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontWeight: "400",
    fontSize: "0.85rem",
  }
};

export const inputStyle = {
  width: "100%",
  padding: "1rem 1.25rem",
  borderRadius: "16px",
  border: `1px solid ${themeColors.borderDivider}`,
  background: "#1E1E1E",
  color: themeColors.textPrimary,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: typography.body.fontFamily,
  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  ":focus": {
    borderColor: themeColors.accentPrimary,
    boxShadow: `0 0 0 3px rgba(201, 162, 39, 0.15)`
  }
};

export const buttonStyle = {
  marginTop: "1rem",
  padding: "0.8rem 1.8rem",
  borderRadius: "16px",
  border: `1px solid ${themeColors.borderDivider}`,
  background: "#FFFFFF",
  color: "#121212",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  fontFamily: typography.body.fontFamily,
  transition: "all 0.2s ease",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
};

export const linkButtonStyle = {
  background: "none",
  border: "none",
  color: themeColors.textSecondary,
  cursor: "pointer",
  padding: 0,
  fontSize: "0.85rem",
  fontWeight: 600,
  fontFamily: typography.body.fontFamily,
  textDecoration: "underline",
  transition: "color 0.2s ease",
};

export const cardStyle = {
  background: themeColors.panelSurface,
  border: `1px solid ${themeColors.borderDivider}`,
  borderRadius: "16px",
  padding: "2rem",
  marginTop: "1.5rem",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  boxSizing: "border-box",
};

export const sectionLabelStyle = {
  fontFamily: typography.mono.fontFamily,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: themeColors.textSecondary,
  margin: "0 0 0.5rem 0",
};

export const pillStyle = {
  background: "#222222",
  border: `1px solid ${themeColors.borderDivider}`,
  padding: "0.3rem 0.7rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  color: themeColors.textSecondary,
  fontFamily: typography.mono.fontFamily,
};

export function confidenceStyle(score) {
  if (score >= 80) {
    return {
      color: themeColors.confidenceHigh,
      bg: "rgba(16, 185, 129, 0.08)",
      border: `1px solid rgba(16, 185, 129, 0.25)`,
      label: "High Confidence"
    };
  }
  if (score >= 40) {
    return {
      color: themeColors.confidenceMedium,
      bg: "rgba(245, 158, 11, 0.08)",
      border: `1px solid rgba(245, 158, 11, 0.25)`,
      label: "Medium Confidence"
    };
  }
  return {
    color: themeColors.confidenceLow,
    bg: "rgba(239, 68, 68, 0.08)",
    border: `1px solid rgba(239, 68, 68, 0.25)`,
    label: "Low Confidence"
  };
}

export const kpiCardStyle = {
  background: themeColors.panelSurface,
  border: `1px solid ${themeColors.borderDivider}`,
  borderRadius: "16px",
  padding: "1.5rem",
  textAlign: "center",
  flex: 1,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

export const spacing = {
  xs: "0.5rem",
  sm: "0.8rem",
  md: "1.5rem",
  lg: "2.5rem",
  xl: "3.5rem",
};

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
};
