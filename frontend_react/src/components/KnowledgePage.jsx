import { useState, useEffect } from "react";
import axios from "axios";
import { askMindVault, listDocuments, deleteDocument } from "../api";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle, confidenceStyle } from "../styles";
import DocUploader from "./DocUploader";
import { Search, Trash2, FileText, Database, ShieldAlert, Sparkles } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function KnowledgePage({ apiKey }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  
  // Documents list states
  const [documents, setDocuments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchDocs = async () => {
    try {
      const data = await listDocuments();
      setDocuments(data || []);
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshTrigger]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const data = await askMindVault(searchQuery, apiKey, "General");
      setSearchResult(data);
    } catch (err) {
      setSearchError(err?.response?.data?.detail || "Something went wrong querying Knowledge.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    try {
      await deleteDocument(filename);
      setRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      alert("Failed to delete document.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Top Section: Upload & Search side-by-side */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* Upload documents panel */}
        <div style={{ flex: "1 1 450px" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.5rem" }}>
              Upload Corporate Knowledge
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1rem" }}>
              Index company manuals, travel guidelines, offer letter templates, or policies.
            </p>
            <DocUploader onUploadSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
          </div>
        </div>

        {/* Semantic Search panel */}
        <div style={{ flex: "1.2 1 500px" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.5rem" }}>
              Semantic Search Engine
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Query corporate data. MindVault retrieves context chunks to assemble verified answers.
            </p>

            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="e.g. What are the rules regarding annual leave rollover?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={searchLoading}
                style={{
                  ...buttonStyle,
                  marginTop: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: themeColors.accentPrimary,
                  color: "#121212",
                  border: "none",
                }}
              >
                <Search size={16} />
                Search
              </button>
            </form>

            {searchError && (
              <div style={{ marginTop: "1rem", color: themeColors.danger, fontSize: "0.85rem" }}>
                {searchError}
              </div>
            )}

            {searchLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", color: themeColors.textSecondary, fontSize: "0.9rem" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid #E2E8F0", borderTopColor: themeColors.accentPrimary, animation: "spin 0.8s linear infinite" }} />
                <span>Running semantic query on index...</span>
              </div>
            )}

            {searchResult && (
              <div style={{ marginTop: "1.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.5rem" }}>
                {/* Confidence indicators */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={16} style={{ color: themeColors.accentPrimary }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>Verified AI Answer</span>
                  </div>
                  {(() => {
                    const c = confidenceStyle(searchResult.confidence_score);
                    return (
                      <span style={{
                        ...pillStyle,
                        color: c.color,
                        background: c.bg,
                        borderColor: c.border,
                        fontSize: "0.75rem",
                        fontWeight: "bold"
                      }}>
                        {c.label} ({searchResult.confidence_score}%)
                      </span>
                    );
                  })()}
                </div>

                {/* AI Answer Text */}
                <p style={{ color: themeColors.textPrimary, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1.25rem 0", whiteSpace: "pre-wrap" }}>
                  {searchResult.answer}
                </p>

                {/* Citations list */}
                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary, marginBottom: "0.5rem" }}>
                      Source Citations
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {searchResult.sources.map((src, idx) => (
                        <span key={idx} style={pillStyle}>
                          📄 {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related / Evidence Snippets */}
                {searchResult.snippets && searchResult.snippets.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary, marginBottom: "0.5rem" }}>
                      Evidence & Extracted Snippets
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {searchResult.snippets.map((snip, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: themeColors.panelSurfaceRaised,
                            border: `1px solid ${themeColors.borderDivider}`,
                            borderRadius: "8px",
                            padding: "0.6rem 0.8rem",
                            fontSize: "0.8rem",
                            color: themeColors.textSecondary,
                            lineHeight: 1.4
                          }}
                        >
                          &ldquo;{snip.text}&rdquo;
                          <div style={{ fontSize: "0.7rem", marginTop: "0.3rem", opacity: 0.8 }}>
                            Source: <strong>{snip.source}</strong> {snip.page_number && <>| Page: <strong>{snip.page_number}</strong></>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Document Directory */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Database size={18} style={{ color: themeColors.accentPrimary }} />
          <h3 style={{ ...typography.heading, fontSize: "1.2rem", margin: 0 }}>
            Knowledge Base Directory ({documents.length} Indexed Assets)
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, color: themeColors.textSecondary }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Filename</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Chunks</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Size</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Department</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Owner</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: themeColors.textSecondary, fontStyle: "italic" }}>
                    No corporate assets indexed in Knowledge Base.
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${themeColors.borderDivider}`,
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = themeColors.panelSurfaceRaised; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileText size={16} style={{ color: themeColors.accentPrimary }} />
                      {doc.filename}
                    </td>
                    <td style={{ padding: "1rem" }}>{doc.chunk_count || 1}</td>
                    <td style={{ padding: "1rem" }}>{(doc.size_bytes / 1024).toFixed(1)} KB</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={pillStyle}>{doc.department || "General"}</span>
                    </td>
                    <td style={{ padding: "1rem" }}>{doc.owner || "System Admin"}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(doc.filename)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: themeColors.danger,
                          padding: "0.25rem",
                          borderRadius: "4px",
                        }}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
