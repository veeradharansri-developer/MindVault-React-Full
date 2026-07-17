import { themeColors, typography, spacing } from "../styles";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      textAlign: "center",
      padding: `${spacing.xl} ${spacing.lg}`,
      color: themeColors.textSecondary,
    }}>
      {Icon && <Icon size={32} style={{ marginBottom: spacing.sm, opacity: 0.6 }} />}
      <div style={{ fontFamily: typography.heading.fontFamily, fontSize: "1.15rem", color: themeColors.textPrimary, marginBottom: "0.4rem" }}>
        {title}
      </div>
      <p style={{ fontSize: "0.9rem", maxWidth: "360px", margin: "0 auto" }}>{description}</p>
      {action && <div style={{ marginTop: spacing.md }}>{action}</div>}
    </div>
  );
}
