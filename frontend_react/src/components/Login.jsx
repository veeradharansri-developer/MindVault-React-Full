import { useState } from "react";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography } from "../styles";
import { Bot, Key, User, ShieldAlert, Users } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Demo user data matching requested specifications.
  // Two isolated teams (Engineering, Sales) each with their own manager, so leave
  // requests and team reports never cross between managers.
  const demoUsers = [
    {
      role: "HR",
      email: "hr@mindvault.ai",
      password: "HR@123",
      name: "Gayathri Arra",
      department: "Human Resources",
      badge: "HR Manager",
      avatar: "👩‍💼",
      team: "HR Operations"
    },
    {
      role: "Employee",
      email: "employee@mindvault.ai",
      password: "EMP@123",
      name: "Sarah Jenkins",
      department: "Customer Support",
      badge: "Support Specialist",
      avatar: "👤",
      team: "Engineering"
    },
    {
      role: "Manager",
      email: "manager@mindvault.ai",
      password: "MGR@123",
      name: "David Miller",
      department: "Operations",
      badge: "Team Lead",
      avatar: "👨‍💼",
      team: "Engineering"
    },
    {
      role: "Manager",
      email: "manager.sales@mindvault.ai",
      password: "MGR@123",
      name: "Ananya Rao",
      department: "Sales",
      badge: "Team Lead",
      avatar: "👨‍💼",
      team: "Sales"
    },
    {
      role: "Employee",
      email: "employee.sales@mindvault.ai",
      password: "EMP@123",
      name: "Karan Verma",
      department: "Sales",
      badge: "Sales Executive",
      avatar: "👤",
      team: "Sales"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      // Find matching user credentials
      const matchedUser = demoUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchedUser) {
        sessionStorage.setItem("userToken", "mindvault-session-token-xyz");
        sessionStorage.setItem("userRole", matchedUser.role);
        sessionStorage.setItem("userName", matchedUser.name);
        sessionStorage.setItem("userDept", matchedUser.department);
        sessionStorage.setItem("userBadge", matchedUser.badge);
        sessionStorage.setItem("userAvatar", matchedUser.avatar);
        sessionStorage.setItem("userEmail", matchedUser.email);
        sessionStorage.setItem("userTeamId", matchedUser.team);
        onLoginSuccess();
      } else {
        setError("Invalid email address or password. Try selecting a quick login role below.");
      }
      setLoading(false);
    }, 600);
  };

  const handleQuickLogin = (u) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: themeColors.bgBase,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        boxSizing: "border-box",
        fontFamily: typography.body.fontFamily
      }}
    >
      <div style={{ ...cardStyle, width: "100%", maxWidth: "440px", marginTop: 0, padding: "2.5rem" }}>
        
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "12px",
              background: "rgba(201, 162, 39, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              border: `1px solid ${themeColors.accentPrimary}33`
            }}
          >
            <Bot size={28} style={{ color: themeColors.accentPrimary }} />
          </div>
          <h2 style={{ ...typography.heading, fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>
            MindVault AI
          </h2>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginTop: "0.4rem", margin: 0 }}>
            Enterprise AI Workplace Assistant
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "8px",
                padding: "0.75rem",
                fontSize: "0.8rem",
                color: themeColors.danger,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <User size={12} />
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ ...inputStyle, padding: "0.75rem 1rem" }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Key size={12} />
              PASSWORD
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, padding: "0.75rem 1rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              marginTop: "0.5rem",
              background: themeColors.accentPrimary,
              color: "#121212",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            {loading ? "Verifying Access Control..." : "Sign In to Workspace"}
          </button>
        </form>

        {/* Demo Roles Quick Selection Buttons */}
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: `1px solid ${themeColors.borderDivider}`,
            paddingTop: "1.25rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <Users size={14} style={{ color: themeColors.accentPrimary }} />
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              SELECT DEMO PERSONA FOR AUDIT
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {demoUsers.map((u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickLogin(u)}
                style={{
                  background: email === u.email ? "rgba(201, 162, 39, 0.12)" : "#1E1E1E",
                  border: `1px solid ${email === u.email ? themeColors.accentPrimary : themeColors.borderDivider}`,
                  borderRadius: "10px",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.78rem",
                  color: themeColors.textPrimary,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{u.avatar} <strong>{u.role}</strong> ({u.name})</span>
                <span style={{ color: themeColors.textSecondary, fontSize: "0.7rem" }}>{u.password}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
