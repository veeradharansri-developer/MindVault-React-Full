import { useState, useRef, useEffect } from "react";
import { askMindVault, notifyExpert, generatePPT, logActivity } from "../api";
import {
  inputStyle, buttonStyle, linkButtonStyle, cardStyle,
  sectionLabelStyle, pillStyle, confidenceStyle, themeColors, typography
} from "../styles";


export default function AskTab({ apiKey, selectedTeam, prefilledQuery, setPrefilledQuery }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState("");
  const [notifiedExperts, setNotifiedExperts] = useState({});
  const [generatingPPT, setGeneratingPPT] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'positive', 'negative', or null
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (prefilledQuery) {
      setQuery(prefilledQuery);
      const executePrefilled = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setNotifiedExperts({});
        setFeedback(null);
        try {
          const data = await askMindVault(prefilledQuery, apiKey, selectedTeam);
          setResult(data);
        } catch (err) {
          setError(err?.response?.data?.detail || "Something went wrong reaching the API.");
        } finally {
          setLoading(false);
          if (setPrefilledQuery) {
            setPrefilledQuery("");
          }
        }
      };
      executePrefilled();
    }
  }, [prefilledQuery]);

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
    setNotifiedExperts({});
    setFeedback(null);
    try {
      const data = await askMindVault(query, apiKey, selectedTeam);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong reaching the API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNotifyExpert(expertName) {
    setNotifiedExperts((prev) => ({
      ...prev,
      [expertName]: { status: "sending", message: "" }
    }));
    try {
      const data = await notifyExpert(expertName, query);
      setNotifiedExperts((prev) => ({
        ...prev,
        [expertName]: { status: "success", message: data.message }
      }));
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || "Failed to notify expert.";
      setNotifiedExperts((prev) => ({
        ...prev,
        [expertName]: { status: "error", message: errorMsg }
      }));
    }
  }

  async function handleDownloadAnswerCard() {
    if (!result) return;
    setGeneratingPPT(true);
    try {
      const blob = await generatePPT({
        mode: "ask",
        ask_data: {
          query,
          answer: result.answer,
          confidence_score: result.confidence_score,
          sources: result.sources,
          experts: result.experts
        }
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mindvault_answer_${new Date().toISOString().slice(0, 10)}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          alert("Failed to generate answer card slide: " + (parsed.detail || ""));
        } catch (e) {
          alert("Failed to generate answer card slide.");
        }
      } else {
        alert("Failed to generate answer card slide: " + (err.response?.data?.detail || ""));
      }
    } finally {
      setGeneratingPPT(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.9rem" }}>
          Query HR guidelines, leave policies, and onboarding SOPs.
        </p>
        <span style={{ fontSize: "0.8rem", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily }}>
          Active Team: {selectedTeam}
        </span>
      </div>
      <form onSubmit={handleAsk}>
        <div style={{ position: "relative" }}>
          <textarea
            placeholder="e.g. What is the remote work policy for new hires?"
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
            Listening... speak your question now
          </p>
        )}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Thinking..." : "Ask MindVault"}
        </button>
      </form>

      {error && (
        (() => {
          const isNoDocsIndexed = error.toLowerCase().includes("no documents indexed") || error.toLowerCase().includes("no indexed documents");
          return (
            <div
              style={{
                ...cardStyle,
                borderColor: isNoDocsIndexed ? "rgba(201, 162, 39, 0.5)" : "#f8717155",
                color: isNoDocsIndexed ? themeColors.textPrimary : "#f87171",
              }}
            >
              {error}
            </div>
          );
        })()
      )}

      {result && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ ...typography.heading, marginTop: 0, fontSize: "1.4rem" }}>Answer</h3>
              <p style={{ color: themeColors.textPrimary, lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                {result.answer}
              </p>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>Was this helpful?</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logActivity({
                      activity_type: "feedback_positive",
                      description: `Positive feedback on query: "${query.slice(0, 30)}..."`,
                      details: `Answer: "${result.answer.slice(0, 80)}..."`
                    });
                    setFeedback("positive");
                  } catch (e) { console.error(e); }
                }}
                style={{
                  background: feedback === "positive" ? "rgba(95, 167, 119, 0.2)" : "transparent",
                  border: `1px solid ${feedback === "positive" ? themeColors.confidenceHigh : themeColors.borderDivider}`,
                  borderRadius: "6px",
                  color: feedback === "positive" ? themeColors.confidenceHigh : themeColors.textPrimary,
                  padding: "0.2rem 0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                👍 Yes
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logActivity({
                      activity_type: "feedback_negative",
                      description: `Negative feedback on query: "${query.slice(0, 30)}..."`,
                      details: `Answer: "${result.answer.slice(0, 80)}..."`
                    });
                    setFeedback("negative");
                  } catch (e) { console.error(e); }
                }}
                style={{
                  background: feedback === "negative" ? "rgba(201, 82, 79, 0.2)" : "transparent",
                  border: `1px solid ${feedback === "negative" ? themeColors.confidenceLow : themeColors.borderDivider}`,
                  borderRadius: "6px",
                  color: feedback === "negative" ? themeColors.confidenceLow : themeColors.textPrimary,
                  padding: "0.2rem 0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                👎 No
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setShowReasoning((v) => !v)} style={linkButtonStyle}>
                {showReasoning ? "Hide" : "Show"} reasoning details
              </button>
              <button
                type="button"
                onClick={handleDownloadAnswerCard}
                disabled={generatingPPT}
                style={{
                  ...linkButtonStyle,
                  color: themeColors.highlightAmber,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  textDecoration: "none"
                }}
              >
                🖥️ {generatingPPT ? "Downloading..." : "Export as PPT Slide"}
              </button>
            </div>
          </div>
          {showReasoning && (
            <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", marginTop: "0.75rem", fontStyle: "italic" }}>
              {result.reasoning}
            </p>
          )}

          {/* Evidence Snippets & Page Citations */}
          {result.snippets && result.snippets.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h4 style={sectionLabelStyle}>Evidence Citations & Snippets</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {result.snippets.map((snip, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.01)",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "8px",
                      padding: "0.6rem 0.8rem",
                      fontSize: "0.85rem"
                    }}
                  >
                    <p style={{ margin: "0 0 0.4rem 0", color: themeColors.textPrimary, lineHeight: 1.4 }}>
                      &ldquo;{snip.text}&rdquo;
                    </p>
                    <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                      Source: <strong>{snip.source}</strong> {snip.page_number && <>| Page: <strong>{snip.page_number}</strong></>} | Score: <strong>{(snip.score * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources Summary fallback */}
          {(!result.snippets || result.snippets.length === 0) && result.sources && (
            <div style={{ marginTop: "1.5rem" }}>
              <h4 style={sectionLabelStyle}>Sources</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {result.sources.map((s, i) => (
                  <span key={i} style={pillStyle}>📄 {s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Low Confidence Gap Alert */}
          {result.confidence_score < 70 && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid rgba(239, 91, 91, 0.3)", borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: themeColors.confidenceLow, fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                ⚠️ LOW CONFIDENCE WARNING (GAP DETECTED)
              </div>
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 0.6rem 0", lineHeight: 1.4 }}>
                This RAG answer has a confidence of {result.confidence_score}%. A knowledge gap report has been logged.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: themeColors.textPrimary }}>Recommendation:</span>
                <span style={{ ...pillStyle, color: themeColors.highlightAmber, background: "rgba(201, 162, 39, 0.1)" }}>
                  Start Policy Update Workflow
                </span>
              </div>
            </div>
          )}

          {result.experts && result.experts.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h4 style={sectionLabelStyle}>Policy Experts Contacts</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.experts.map((e, i) => {
                  const status = notifiedExperts[e];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ ...pillStyle, color: themeColors.highlightAmber, background: "rgba(201, 162, 39, 0.1)" }}>👤 {e}</span>
                      
                      {(!status || status.status === "error") && (
                        <button
                          type="button"
                          onClick={() => handleNotifyExpert(e)}
                          disabled={status?.status === "sending"}
                          style={{
                            background: "rgba(201, 162, 39, 0.15)",
                            border: `1px solid ${themeColors.borderDivider}`,
                            borderRadius: "6px",
                            color: themeColors.textPrimary,
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            fontWeight: 600,
                            transition: "all 0.2s",
                          }}
                        >
                          {status?.status === "sending" ? "Sending..." : `Notify Expert`}
                        </button>
                      )}
                      
                      {status?.status === "sending" && (
                        <span style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>Sending email alert...</span>
                      )}
                      
                      {status?.status === "success" && (
                        <span style={{ fontSize: "0.8rem", color: themeColors.confidenceHigh, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          ✅ {status.message}
                        </span>
                      )}
                      
                      {status?.status === "error" && (
                        <span style={{ fontSize: "0.8rem", color: themeColors.confidenceLow }}>
                          ❌ {status.message}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
