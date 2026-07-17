import { themeColors, typography, spacing } from "../styles";

export default function PageShell({ eyebrow, title, children, maxWidth = "1100px" }) {
  return (
    <div style={{ maxWidth, margin: "0 auto", paddingBottom: spacing.xl }}>
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{
          fontFamily: typography.mono.fontFamily,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: themeColors.highlightAmber,
          marginBottom: "0.25rem",
        }}>
          {eyebrow}
        </div>
        <h1 style={{ fontFamily: typography.heading.fontFamily, fontSize: "2.2rem", fontWeight: 700, margin: 0, color: themeColors.textPrimary }}>
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
