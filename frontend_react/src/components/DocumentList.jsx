import { useState, useEffect } from "react";
import axios from "axios";
import { listDocuments, deleteDocument } from "../api";
import { cardStyle, pillStyle, linkButtonStyle, themeColors, typography, inputStyle } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DeleteButton({ filename, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [timerId, setTimerId] = useState(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (confirm) {
      if (timerId) clearTimeout(timerId);
      setConfirm(false);
      onDelete(filename);
    } else {
      setConfirm(true);
      const id = setTimeout(() => {
        setConfirm(false);
      }, 4000); // 4-second confirmation window
      setTimerId(id);
    }
  };

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const normalStyle = {
    background: "rgba(239, 91, 91, 0.05)",
    border: `1px solid ${themeColors.borderDivider}`,
    color: themeColors.confidenceLow,
    padding: "0.35rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  };

  const confirmStyle = {
    background: themeColors.confidenceLow,
    border: `1px solid ${themeColors.confidenceLow}`,
    color: "#ffffff",
    padding: "0.35rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 0 10px rgba(239, 91, 91, 0.4)",
  };

  return (
    <button
      onClick={handleClick}
      style={confirm ? confirmStyle : normalStyle}
    >
      {confirm ? "Confirm delete?" : "Delete"}
    </button>
  );
}

export default function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [teams, setTeams] = useState(["General"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [expanded, setExpanded] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/teams`);
      if (Array.isArray(res.data)) {
        setTeams(res.data.map(t => t.name || t));
      }
    } catch (e) {
      console.warn("Could not fetch teams for DocumentList dropdown:", e);
    }
  };

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchTeams();
      const data = await listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshTrigger]);

  const handleDelete = async (filename) => {
    setInfoMessage("");
    setErrorMessage("");

    const previousDocs = [...documents];
    // Optimistic UI update
    setDocuments((prev) => prev.filter((d) => d.filename !== filename));

    try {
      await deleteDocument(filename);
      setInfoMessage(`Deleted ${filename}`);
      setTimeout(() => {
        setInfoMessage("");
      }, 3000);
    } catch (err) {
      // Revert on error
      setDocuments(previousDocs);
      const errMsg = err?.response?.data?.detail || `Failed to delete ${filename}`;
      setErrorMessage(errMsg);
    }
  };

  const handleTeamChange = async (filename, newTeam) => {
    try {
      // Call api to update team
      await axios.post(`${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}/team`, {
        team_id: newTeam
      });
      // Update local state
      setDocuments(prev => prev.map(d => d.filename === filename ? { ...d, team_id: newTeam } : d));
      setInfoMessage(`Assigned ${filename} to ${newTeam}`);
      setTimeout(() => setInfoMessage(""), 3000);
    } catch (err) {
      setErrorMessage(err?.response?.data?.detail || `Failed to update team for ${filename}`);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  return (
    <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: expanded ? "1rem" : "0",
          cursor: "pointer",
          userSelect: "none",
          padding: "0.25rem",
          borderRadius: "6px",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <h3 style={{ ...typography.heading, margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          📂 Indexed Documents
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: "inline-block",
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchDocs();
          }}
          disabled={loading}
          style={{ ...linkButtonStyle, fontSize: "0.9rem", color: themeColors.highlightAmber, textDecoration: "none" }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {expanded && (
        <>
          {infoMessage && (
            <p style={{ color: themeColors.confidenceHigh, fontSize: "0.9rem", margin: "0 0 1rem 0", fontWeight: 500 }}>
              {infoMessage}
            </p>
          )}

          {errorMessage && (
            <p style={{ color: themeColors.confidenceLow, fontSize: "0.9rem", margin: "0 0 1rem 0", fontWeight: 500 }}>
              ❌ {errorMessage}
            </p>
          )}

          {error && (
            <p style={{ color: themeColors.confidenceLow, fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
              {error}
            </p>
          )}

          {loading && documents.length === 0 ? (
            <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.9rem" }}>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.9rem", fontStyle: "italic" }}>
              No documents currently indexed.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.25rem" }}>
              {documents.map((doc) => (
                <div
                  key={doc.filename}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    background: themeColors.panelSurfaceRaised,
                    border: `1px solid ${themeColors.borderDivider}`,
                    borderRadius: "8px",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: "1 1 200px" }}>
                    <span style={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: "0.95rem" }}>📄 {doc.filename}</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={pillStyle}>{doc.chunk_count} chunk(s)</span>
                      <span style={{ ...pillStyle, opacity: 0.8 }}>{formatBytes(doc.size_bytes)}</span>
                      
                      {/* Show current team badge */}
                      <span style={{
                        ...pillStyle,
                         background: "rgba(201, 162, 39, 0.1)",
                        color: themeColors.highlightAmber,
                        border: `1px solid ${themeColors.highlightAmber}33`
                      }}>
                        Team: {doc.team_id || "General"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* Team assignment dropdown */}
                    <select
                      value={doc.team_id || "General"}
                      onChange={(e) => handleTeamChange(doc.filename, e.target.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "6px",
                         background: "#1A1A1A",
                        color: themeColors.textPrimary,
                        border: `1px solid ${themeColors.borderDivider}`,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {teams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <DeleteButton filename={doc.filename} onDelete={handleDelete} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
