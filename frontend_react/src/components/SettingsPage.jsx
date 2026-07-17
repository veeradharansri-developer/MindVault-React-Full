import { useState } from "react";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { Settings, ShieldCheck, Key, Users, User } from "lucide-react";

export default function SettingsPage({ apiKey, setApiKey, selectedTeam, setSelectedTeam, userRole, setUserRole }) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [roleInput, setRoleInput] = useState(userRole || "General Employee");
  const [teamInput, setTeamInput] = useState(selectedTeam || "General");

  const handleSave = () => {
    if (setApiKey) setApiKey(keyInput);
    if (setSelectedTeam) setSelectedTeam(teamInput);
    if (setUserRole) setUserRole(roleInput);
    alert("Configuration profiles successfully saved.");
  };

  const roles = ["Software Engineer", "HR Manager", "Customer Support Representative", "General Employee"];
  const teams = ["General", "Engineering", "HR", "Finance", "Legal"];

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", width: "100%" }}>
      <div style={{ ...cardStyle, marginTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Settings size={20} style={{ color: themeColors.accentPrimary }} />
          <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
            System Configuration Profiles
          </h3>
        </div>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Adjust authorization credentials, organizational filters, and role persona styling targets.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* API Key */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Key size={14} />
              GROQ API KEY
            </label>
            <input
              type="password"
              placeholder="Groq API key (e.g. gsk_... or leave blank to use default)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={inputStyle}
            />
            <p style={{ color: themeColors.textSecondary, fontSize: "0.78rem", margin: 0 }}>
              Leave blank to fall back on system-wide API environments.
            </p>
          </div>

          {/* Persona Role */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <User size={14} />
              ACTIVE USER PERSONA ROLE
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              style={{ ...inputStyle, padding: "0.75rem 1rem", background: "#1E1E1E" }}
            >
              {roles.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Selected Team filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Users size={14} />
              ORGANIZATIONAL TEAM SCOPE
            </label>
            <select
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              style={{ ...inputStyle, padding: "0.75rem 1rem", background: "#1E1E1E" }}
            >
              {teams.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <div style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSave}
              style={{
                ...buttonStyle,
                marginTop: 0,
                background: themeColors.accentPrimary,
                color: "#121212",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <ShieldCheck size={16} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
