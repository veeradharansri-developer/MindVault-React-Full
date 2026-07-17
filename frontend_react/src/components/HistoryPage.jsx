import { useState, useEffect } from "react";
import axios from "axios";
import { getActivity, getWorkflowLogs } from "../api";
import { cardStyle, inputStyle, themeColors, typography, pillStyle } from "../styles";
import { Clock, Search, MessageSquare, Zap, FileText, ArrowRight } from "lucide-react";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const actData = await getActivity();
      setActivities(actData || []);
      const wfData = await getWorkflowLogs();
      setWorkflows(wfData || []);
    } catch (e) {
      console.error("Failed to load history metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredActivities = activities.filter((act) => {
    return act.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           act.activity_type?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredWorkflows = workflows.filter((wf) => {
    return wf.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           wf.query?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>
      {/* Search Header */}
      <div style={{ ...cardStyle, marginTop: 0 }}>
        <h3 style={{ ...typography.heading, fontSize: "1.25rem", marginTop: 0, marginBottom: "0.5rem" }}>
          Enterprise Audit History Log
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Trace AI search histories, generated documents, and automated rule executions.
        </p>

        <div style={{ position: "relative", maxWidth: "600px" }}>
          <input
            type="text"
            placeholder="Search history, queries, or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2.5rem" }}
          />
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: themeColors.textSecondary }} />
        </div>
      </div>

      {/* Grid: Conversations vs Workflows */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        
        {/* Left Column: Recent conversations / queries */}
        <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <MessageSquare size={18} style={{ color: themeColors.accentPrimary }} />
              <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
                Recent Conversations & Queries
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto" }}>
              {filteredActivities.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontStyle: "italic", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>
                  No recent conversation logs found.
                </p>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      background: themeColors.panelSurfaceRaised,
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...pillStyle, fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
                        {act.activity_type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                        {act.timestamp}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.88rem", margin: 0, color: themeColors.textPrimary, fontWeight: 500 }}>
                      {act.description}
                    </p>
                    
                    {act.details && (
                      <code style={{ fontSize: "0.75rem", fontFamily: typography.mono.fontFamily, color: themeColors.textSecondary, background: "rgba(0,0,0,0.02)", padding: "0.4rem", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                        {act.details.slice(0, 150)}{act.details.length > 150 && "..."}
                      </code>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow triggers history */}
        <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Zap size={18} style={{ color: themeColors.accentPrimary }} />
              <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
                Recent Workflows History
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto" }}>
              {filteredWorkflows.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontStyle: "italic", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>
                  No recent workflow triggers found.
                </p>
              ) : (
                filteredWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    style={{
                      background: themeColors.panelSurfaceRaised,
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...pillStyle, fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
                        {wf.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                        {wf.created_at}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.88rem", margin: 0, color: themeColors.textPrimary, fontWeight: 500 }}>
                      Rule: {wf.rule_name}
                    </p>

                    <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>
                      Query: &ldquo;{wf.query}&rdquo;
                    </div>

                    <div style={{ fontSize: "0.8rem", color: themeColors.textPrimary, fontWeight: 600 }}>
                      Action: {wf.action_executed}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
