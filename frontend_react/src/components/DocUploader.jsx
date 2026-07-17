import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { themeColors, inputStyle, typography } from "../styles";
import { UploadCloud } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function DocUploader({ onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState(["General"]);
  const [selectedTeam, setSelectedTeam] = useState("General");
  const [department, setDepartment] = useState("General");
  const [owner, setOwner] = useState("General");
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/teams`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setTeams(res.data.map(t => t.name || t));
        }
      })
      .catch(err => {
        console.warn("Could not fetch teams for uploader, defaulting to 'General':", err);
      });
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleUpload = async (file) => {
    const allowed = [".txt", ".pdf", ".docx", ".pptx", ".xlsx", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Supported file formats: PDF, DOCX, TXT, CSV, PPTX, XLSX.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/upload-doc?team_id=${encodeURIComponent(selectedTeam)}&department=${encodeURIComponent(department)}&owner=${encodeURIComponent(owner)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      setMessage(`✓ Uploaded and indexed: ${response.data.filename}`);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      const errMsg = err?.response?.data?.detail || "Failed to upload document.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      
      {/* Parameters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
            Assign to Team Context
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{
              ...inputStyle,
              padding: "0.6rem 0.8rem",
              background: "#1E1E1E",
              color: themeColors.textPrimary,
            }}
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. HR Operations"
              style={{ ...inputStyle, padding: "0.6rem 0.8rem" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Jessica Chen"
              style={{ ...inputStyle, padding: "0.6rem 0.8rem" }}
            />
          </div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? themeColors.accentPrimary : themeColors.borderDivider}`,
          borderRadius: "12px",
          background: isDragOver ? "rgba(16, 185, 129, 0.04)" : "#1E1E1E",
          padding: "2rem 1.25rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.25s ease",
        }}
      >
        <input
          type="file"
          accept=".txt,.pdf,.docx,.pptx,.xlsx,.csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <UploadCloud size={28} style={{ color: isDragOver ? themeColors.accentPrimary : themeColors.textSecondary, margin: "0 auto 0.5rem" }} />
        <p style={{ margin: 0, color: themeColors.textSecondary, fontSize: "0.82rem", lineHeight: 1.4 }}>
          {loading ? "Processing and indexing file..." : "Drag & drop PDF, DOCX, TXT, CSV, PPTX, or XLSX here, or click to browse"}
        </p>
      </div>
      {message && (
        <p style={{ color: themeColors.success, fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ color: themeColors.danger, fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
