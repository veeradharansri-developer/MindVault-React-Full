import { useState, useEffect } from "react";
import { getInsights, getGapReports, getAnalytics } from "../api";
import { cardStyle, buttonStyle, themeColors, typography, sectionLabelStyle, pillStyle, kpiCardStyle } from "../styles";
import { BarChart3, AlertTriangle, Users, FileText, RefreshCw } from "lucide-react";

export default function AnalyticsDashboard({ apiKey }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data states
  const [insights, setInsights] = useState(null);
  const [gapReports, setGapReports] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Get RAG Insights (experts, raw query log gaps)
      const insightsData = await getInsights();
      setInsights(insightsData);

      // 2. Get Proactive Gap Reports (LLM clustering)
      const reportsData = await getGapReports(apiKey);
      setGapReports(reportsData);

      // 3. Get System KPIs & Charts metrics
      const metricsData = await getAnalytics();
      setMetrics(metricsData);

      // 4. Get Tickets
      const resTickets = await axios.get(`${API_BASE_URL}/api/tickets`);
      setTickets(resTickets.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to compile analytics metrics and gap audits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [apiKey]);

  if (loading && !metrics) return <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Compiling metrics and RAG audits...</p>;
  if (error) return <div style={{ ...cardStyle, borderColor: `${themeColors.confidenceLow}55`, color: themeColors.confidenceLow }}>{error}</div>;

  const expertEntries = Object.entries(insights?.experts || {});

  // Compute ticket priority counts
  const priorities = { critical: 0, high: 0, medium: 0, low: 0 };
  tickets.forEach(t => {
    const prio = (t.priority || "medium").toLowerCase();
    if (priorities[prio] !== undefined) {
      priorities[prio]++;
    } else {
      priorities.medium++;
    }
  });
  const maxPrioCount = Math.max(...Object.values(priorities), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Header with Refresh */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.9rem" }}>
          Analyze knowledge coverage, system activity, and automatic compliance audits.
        </p>
        <button
          onClick={loadAllAnalytics}
          disabled={loading}
          style={{
            ...buttonStyle,
            marginTop: 0,
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {/* 2. KPI Cards */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#a78bfa" }}>{metrics.documents_uploaded}</div>
            <div style={{ color: themeColors.textSecondary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Docs Indexed</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#a78bfa" }}>{metrics.knowledge_queries}</div>
            <div style={{ color: themeColors.textSecondary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Queries Answered</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.confidenceLow }}>{tickets.filter(t => t.status !== "resolved").length}</div>
            <div style={{ color: themeColors.textSecondary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Open Tickets</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.highlightAmber }}>{metrics.hours_saved}h</div>
            <div style={{ color: themeColors.textSecondary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Hours Saved</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.confidenceHigh }}>{metrics.accuracy}%</div>
            <div style={{ color: themeColors.textSecondary, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>AI Accuracy</div>
          </div>
        </div>
      )}

      {/* 3. Charts Section */}
      {metrics && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ ...cardStyle, flex: "1 1 300px", marginTop: 0 }}>
            <div style={sectionLabelStyle}>WEEKLY VOLUME</div>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>Daily Activity (Queries)</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "0 1rem" }}>
              {metrics.daily_activity.map(d => (
                <div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "10%" }}>
                  <div style={{ width: "100%", height: `${Math.max(d.queries * 4, 3)}px`, background: `linear-gradient(180deg, ${themeColors.highlightAmber} 0%, #232323 100%)`, borderRadius: "4px" }} />
                  <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.4rem" }}>{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: "1 1 300px", marginTop: 0 }}>
            <div style={sectionLabelStyle}>TICKET ANALYSIS</div>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>Support Ticket Priorities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", height: "150px", justifyContent: "center" }}>
              {Object.entries(priorities).map(([prio, count]) => (
                <div key={prio} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", width: "55px", textTransform: "capitalize", color: themeColors.textSecondary }}>{prio}</span>
                  <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ width: `${(count / maxPrioCount) * 100}%`, height: "100%", background: prio === "critical" || prio === "high" ? themeColors.confidenceLow : themeColors.highlightAmber, borderRadius: "5px" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", width: "20px", textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: "1 1 300px", marginTop: 0 }}>
            <div style={sectionLabelStyle}>CUMULATIVE PERFORMANCE</div>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>Monthly Hours Saved</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "0 1rem" }}>
              {metrics.monthly_activity.map(m => (
                <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12%" }}>
                  <div style={{ width: "100%", height: `${Math.max(m.saved * 1.2, 5)}px`, background: `linear-gradient(180deg, ${themeColors.highlightAmber} 0%, #232323 100%)`, borderRadius: "4px" }} />
                  <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.4rem" }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Knowledge Gap Clustering Audit */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>PROACTIVE GAP ANALYSIS</div>
        <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
          Knowledge Base Gap Reports (Audited)
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
          Automated LLM clustering of low-confidence questions. Add corresponding guidelines to expand RAG coverage.
        </p>

        {gapReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", border: `1px dashed ${themeColors.borderDivider}`, borderRadius: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>🎯</span>
            <h4 style={{ ...typography.heading, margin: "0.5rem 0 0.25rem 0", fontSize: "1.1rem" }}>100% Coverage!</h4>
            <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.85rem" }}>
              All user queries met confidence thresholds. No gaps logged.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {gapReports.map((report) => (
              <div
                key={report.id}
                style={{
                  background: "#1A1A1A",
                  borderLeft: `3px solid ${themeColors.highlightAmber}`,
                  borderRadius: "0 8px 8px 0",
                  padding: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
                    Theme: {report.theme}
                  </h4>
                  <span style={{ backgroundColor: themeColors.badgeAmber, color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily, fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>
                    Size: {report.cluster_size} queries
                  </span>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={sectionLabelStyle}>Sample Queries</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {report.queries.map((q, qidx) => (
                      <div key={qidx} style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(255,255,255,0.05)" }}>
                        &ldquo;{q}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...sectionLabelStyle, color: themeColors.confidenceHigh }}>Suggested Action</div>
                  <p style={{ color: themeColors.textPrimary, margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>
                    {report.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Expert Ownership Map & Raw Gaps Log */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        
        {/* Expert Map */}
        <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
          <div style={sectionLabelStyle}>DIRECTORY</div>
          <h3 style={{ ...typography.heading, fontSize: "1.25rem", marginTop: 0, marginBottom: "1rem" }}>Policy Experts Directory</h3>
          {expertEntries.length === 0 ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic", margin: 0 }}>No expert contacts mapped.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: themeColors.textPrimary }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${themeColors.borderDivider}`, fontSize: "0.85rem", color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.5rem 0" }}>Document / Policy</th>
                  <th style={{ padding: "0.5rem 0" }}>Expert Owners</th>
                </tr>
              </thead>
              <tbody>
                {expertEntries.map(([file, experts]) => (
                  <tr key={file} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: "0.85rem" }}>
                    <td style={{ padding: "0.6rem 0", fontWeight: 500 }}>📄 {file}</td>
                    <td style={{ padding: "0.6rem 0", color: themeColors.highlightAmber, fontWeight: 600 }}>{experts.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Raw logged low confidence queries */}
        <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
          <div style={sectionLabelStyle}>AUDIT LOG</div>
          <h3 style={{ ...typography.heading, fontSize: "1.25rem", marginTop: 0, marginBottom: "1rem" }}>Logged Low-Confidence Queries</h3>
          {insights?.gap_queries?.length === 0 ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic", margin: 0 }}>No unresolved queries logged.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: themeColors.textPrimary }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${themeColors.borderDivider}`, fontSize: "0.85rem", color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.5rem 0" }}>Unresolved Query</th>
                  <th style={{ padding: "0.5rem 0" }}>Logged At</th>
                </tr>
              </thead>
              <tbody>
                {insights?.gap_queries?.slice(0, 8).map((g, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: "0.85rem" }}>
                    <td style={{ padding: "0.6rem 0", fontStyle: "italic" }}>&ldquo;{g.query}&rdquo;</td>
                    <td style={{ padding: "0.6rem 0", color: themeColors.textSecondary }}>{new Date(g.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Styles */}
      <style>{`
        .spin {
          animation: spinAnimation 1s linear infinite;
        }
        @keyframes spinAnimation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
