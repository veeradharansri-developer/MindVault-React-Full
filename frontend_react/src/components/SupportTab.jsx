import { useState, useRef } from "react";
import { askMindVault } from "../api";
import {
  inputStyle, buttonStyle, cardStyle,
  confidenceStyle, themeColors, typography
} from "../styles";

const categoryColors = {
  billing: { bg: "rgba(59, 130, 246, 0.2)", border: "#3b82f6", text: "#93c5fd", label: "Billing" },
  technical: { bg: "rgba(168, 85, 247, 0.2)", border: "#a855f7", text: "#d8b4fe", label: "Technical" },
  urgent: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#fca5a5", label: "Urgent" },
  general: { bg: "rgba(107, 114, 128, 0.2)", border: "#6b7280", text: "#d1d5db", label: "General" }
};

export default function SupportTab({ apiKey }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState("");
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setListeningError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setListeningError("");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (event) => {
        setListeningError("Error during speech recognition: " + event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  async function handleAsk(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Direct call to ask endpoint; router classifies as "support" automatically based on text!
      const data = await askMindVault(query, apiKey, "Support");
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong reaching the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.9rem" }}>
          Resolve customer billing, shipping, refunds, and troubleshooting issues.
        </p>
        <span style={{ fontSize: "0.8rem", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily }}>
          Customer Support Console
        </span>
      </div>

      <form onSubmit={handleAsk}>
        <div style={{ position: "relative" }}>
          <textarea
            placeholder="e.g. How can I get a refund for my subscription?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              paddingRight: "3rem",
              borderColor: themeColors.borderDivider,
            }}
          />
          <button
            type="button"
            onClick={toggleListening}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "0.75rem",
              background: isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${isListening ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
              borderRadius: "50%",
              width: "2.2rem",
              height: "2.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: isListening ? "#ef4444" : themeColors.textSecondary,
              transition: "all 0.2s",
            }}
            title="Voice input"
          >
            🎤
          </button>
        </div>
        {listeningError && (
          <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>{listeningError}</p>
        )}
        {isListening && (
          <p style={{ color: themeColors.highlightAmber, fontSize: "0.85rem", margin: "0.25rem 0 0 0", fontStyle: "italic" }}>
            Listening... speak your support request now
          </p>
        )}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Routing to Support Agent..." : "Submit Customer Query"}
        </button>
      </form>

      {error && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#f8717155",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <h3 style={{ ...typography.heading, margin: 0, fontSize: "1.4rem" }}>Agent Response</h3>
                {result.category && (() => {
                  const cat = categoryColors[result.category.toLowerCase()] || categoryColors.general;
                  return (
                    <span
                      style={{
                        backgroundColor: cat.bg,
                        border: `1px solid ${cat.border}`,
                        color: cat.text,
                        borderRadius: "12px",
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {cat.label}
                    </span>
                  );
                })()}
              </div>
              <p style={{ color: themeColors.textPrimary, lineHeight: 1.6, margin: 0, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                {result.answer}
              </p>

              {result.escalate && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(201, 162, 39, 0.15)",
                    border: "1px solid rgba(201, 162, 39, 0.3)",
                    borderRadius: "8px",
                    color: themeColors.highlightAmber,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  ⚠️ This request may need escalation to a human agent.
                </div>
              )}
            </div>
            
            {(() => {
              const c = confidenceStyle(result.confidence_score);
              return (
                <div
                  style={{
                    flexShrink: 0,
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: themeColors.badgeViolet,
                    border: `2px solid ${c.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.color,
                    fontFamily: typography.mono.fontFamily,
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                  title={`${c.label}: ${result.confidence_score}/100`}
                >
                  {result.confidence_score}%
                </div>
              );
            })()}
          </div>

          {result.sources && result.sources.length > 0 && (
            <div style={{ marginTop: "1.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1rem" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600, marginBottom: "0.5rem" }}>
                Retrieved References
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {result.sources.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "6px",
                      padding: "0.25rem 0.5rem",
                      color: themeColors.textSecondary
                    }}
                  >
                    📄 {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
