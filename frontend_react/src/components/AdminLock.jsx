import { useState } from "react";
import axios from "axios";
import { KeyRound, ShieldAlert } from "lucide-react";
import { themeColors, typography, spacing, radius, inputStyle, buttonStyle } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AdminLock({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/verify-pin`, { pin });
      if (res.data && res.data.token) {
        sessionStorage.setItem("adminToken", res.data.token);
        onUnlock();
      } else {
        setError("Verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid PIN code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: `${spacing.xl} auto`,
      padding: spacing.lg,
      background: themeColors.panelSurface,
      border: `1px solid ${themeColors.borderDivider}`,
      borderRadius: radius.lg,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      textAlign: "center",
    }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        backgroundColor: "rgba(239, 91, 91, 0.1)",
        border: `1px solid ${themeColors.confidenceLow}`,
        color: themeColors.confidenceLow,
        marginBottom: spacing.md,
      }}>
        <ShieldAlert size={28} />
      </div>

      <h3 style={{
        fontFamily: typography.heading.fontFamily,
        color: themeColors.textPrimary,
        fontSize: "1.4rem",
        margin: `0 0 ${spacing.xs} 0`,
      }}>
        Admin Dashboard Locked
      </h3>

      <p style={{
        color: themeColors.textSecondary,
        fontSize: "0.9rem",
        margin: `0 0 ${spacing.lg} 0`,
        lineHeight: 1.4,
      }}>
        Enter the 4-digit system PIN code to access administrative panel controls and logs.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        <input
          type="password"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          style={{
            ...inputStyle,
            textAlign: "center",
            fontSize: "1.8rem",
            letterSpacing: "0.5rem",
            padding: "0.5rem",
            fontFamily: typography.mono.fontFamily,
          }}
          autoFocus
          required
        />

        {error && (
          <p style={{
            color: themeColors.confidenceLow,
            fontSize: "0.85rem",
            margin: 0,
            fontWeight: 500,
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            marginTop: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <KeyRound size={16} />
          {loading ? "Verifying..." : "Unlock Dashboard"}
        </button>
      </form>
    </div>
  );
}
