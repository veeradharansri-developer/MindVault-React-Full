import { useState, useEffect } from "react";
import axios from "axios";
import { getWorkflowLogs, approveWorkflowLog } from "../api";
import { cardStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { CheckCircle2, Eye, RefreshCw, Layers } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function WorkflowsPage({ workflowType }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getWorkflowLogs();
      setLogs(data || []);
    } catch (e) {
      console.error("Failed to load workflow logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleApprove = async (logId) => {
    try {
      await approveWorkflowLog(logId);
      alert("Workflow action authorized successfully.");
      fetchLogs();
      if (activeWorkflow && activeWorkflow.id === logId) {
        setActiveWorkflow((prev) => prev ? { ...prev, status: "approved" } : null);
      }
    } catch (e) {
      alert("Failed to authorize workflow.");
    }
  };

  // Redesigned activeWorkflows with Status, Progress, Approver, Created Time, and Est Completion
  const activeWorkflows = [
    {
      id: "wf-101",
      name: "Offer Letter Release - Rahul Sharma",
      status: "Running",
      progress: 65,
      approver: "HR Director Priya Patel",
      created_time: "10:30 AM",
      est_completion: "10 mins",
      current_step: "Approval Signature",
      timeline: ["Draft Created", "Candidate Verification", "Salary Compliance Check", "Manager Signature", "Offer Dispatched"]
    },
    {
      id: "wf-102",
      name: "Employee Onboarding - Sarah Jenkins",
      status: "Running",
      progress: 40,
      approver: "Support Manager Jessica",
      created_time: "09:15 AM",
      est_completion: "1 hour",
      current_step: "Equipment Provisioning",
      timeline: ["Contract Signed", "Profile Verification", "IT Hardware Setup", "HR Welcome Briefing"]
    },
    {
      id: "wf-104",
      name: "Q3 HR Analysis Compilation",
      status: "Completed",
      progress: 100,
      approver: "Analytics Agent",
      created_time: "2 days ago",
      est_completion: "Completed",
      current_step: "Completed",
      timeline: ["Data Querying", "Metric Aggregation", "Draft Generation", "Report Released"]
    }
  ];

  const isLeave = workflowType?.includes("leave");
  const isOnboard = workflowType?.includes("onboard") || workflowType?.includes("offer");

  const filteredWorkflows = activeWorkflows.filter(wf => {
    if (isLeave) {
      return wf.name.toLowerCase().includes("leave") || wf.name.toLowerCase().includes("request");
    }
    if (isOnboard) {
      return wf.name.toLowerCase().includes("onboard") || wf.name.toLowerCase().includes("offer");
    }
    return true; // show all
  });

  const pageTitle = isLeave 
    ? "Leave Approval Pipeline" 
    : isOnboard 
    ? "Onboarding Workflow Pipelines" 
    : "Active Workflow Pipelines";

  const pageDesc = isLeave 
    ? "Review and authorize internal employee leave applications." 
    : isOnboard 
    ? "Verify and track system setup for newly onboarded personnel." 
    : "Enterprise pipeline monitoring console.";

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Left Column: Workflows Console */}
      <div style={{ flex: "1.6 1 600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", marginTop: 0, marginBottom: "0.25rem" }}>
                {pageTitle}
              </h3>
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: 0 }}>
                {pageDesc}
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              style={{
                ...buttonStyle,
                marginTop: 0,
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "transparent",
                border: `1px solid ${themeColors.borderDivider}`,
                color: themeColors.textPrimary
              }}
            >
              <RefreshCw size={12} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Workflow Pipeline</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Progress</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Approver</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Created</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Est. Completion</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkflows.map((wf) => (
                  <tr
                    key={wf.id}
                    style={{
                      borderBottom: `1px solid ${themeColors.borderDivider}`,
                      transition: "background 0.2s",
                    }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 500 }}>
                      {wf.name}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        ...pillStyle,
                        color: wf.status === "Completed" ? themeColors.success : themeColors.accentPrimary,
                        background: wf.status === "Completed" ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                        borderColor: "transparent"
                      }}>
                        {wf.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", width: "120px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${wf.progress}%`, height: "100%", background: themeColors.accentPrimary }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>{wf.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: themeColors.textSecondary }}>{wf.approver}</td>
                    <td style={{ padding: "1rem", color: themeColors.textSecondary }}>{wf.created_time}</td>
                    <td style={{ padding: "1rem" }}>{wf.est_completion}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => setActiveWorkflow(wf)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: themeColors.accentPrimary
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confidence rules log */}
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.5rem" }}>
            Confidence Rules Authorization Log
          </h3>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Low-confidence alerts triggering manual verification blocks.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
            {logs.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "1.5rem" }}>
                No active rule triggers require review.
              </p>
            ) : (
              logs.map((log) => {
                const isPending = log.status === "pending_review";
                return (
                  <div
                    key={log.id}
                    style={{
                      background: themeColors.panelSurfaceRaised,
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>Rule: {log.rule_name}</span>
                        <span style={{
                          ...pillStyle,
                          fontSize: "0.7rem",
                          padding: "0.1rem 0.4rem",
                          color: isPending ? themeColors.confidenceMedium : themeColors.success,
                          background: isPending ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)"
                        }}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Query: &ldquo;{log.query}&rdquo; (Confidence: {log.confidence_score}%)
                      </div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textPrimary }}>Action: {log.action_executed}</div>
                    </div>
                    {isPending && (
                      <button
                        onClick={() => handleApprove(log.id)}
                        style={{
                          ...buttonStyle,
                          marginTop: 0,
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.75rem"
                        }}
                      >
                        Authorize
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Timeline Inspector */}
      <div style={{ flex: "1 1 380px" }}>
        {activeWorkflow ? (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h4 style={{ ...typography.heading, fontSize: "1.1rem", marginTop: 0, marginBottom: "1rem" }}>
              Timeline Inspector
            </h4>
            <div style={{ fontSize: "0.85rem", color: themeColors.textSecondary, marginBottom: "1.25rem" }}>
              Pipeline: <strong>{activeWorkflow.name}</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
              {activeWorkflow.timeline.map((step, idx) => {
                const isCurrent = activeWorkflow.current_step === step || (activeWorkflow.status === "Completed" && idx === activeWorkflow.timeline.length - 1);
                const isPassed = activeWorkflow.timeline.indexOf(activeWorkflow.current_step) > idx || activeWorkflow.status === "Completed";
                
                return (
                  <div key={idx} style={{ display: "flex", gap: "1rem", position: "relative" }}>
                    {/* Vertical line */}
                    {idx < activeWorkflow.timeline.length - 1 && (
                      <div style={{
                        position: "absolute",
                        left: "9px",
                        top: "18px",
                        bottom: "-20px",
                        width: "2px",
                        background: isPassed ? themeColors.accentPrimary : "#E2E8F0"
                      }} />
                    )}

                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: isPassed || isCurrent ? themeColors.accentPrimary : "#FFFFFF",
                      border: `2px solid ${isPassed || isCurrent ? themeColors.accentPrimary : "#CBD5E1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                    }}>
                      {(isPassed || isCurrent) && <CheckCircle2 size={10} style={{ color: "#FFFFFF" }} />}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{
                        fontSize: "0.88rem",
                        fontWeight: isCurrent ? "600" : "400",
                        color: isCurrent ? themeColors.textPrimary : themeColors.textSecondary
                      }}>
                        {step}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: "0.75rem", color: themeColors.accentPrimary, marginTop: "0.15rem" }}>
                          Active step under review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "2rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1rem", fontSize: "0.8rem", color: themeColors.textSecondary }}>
              <div>Estimated Time Remaining: <strong>{activeWorkflow.est_completion}</strong></div>
              <div style={{ marginTop: "0.4rem" }}>Approver: <strong>{activeWorkflow.approver}</strong></div>
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed" }}>
            <Layers size={42} style={{ color: "#CBD5E1", margin: "0 auto 1rem" }} />
            <h4 style={{ ...typography.heading, fontSize: "1rem", margin: 0, color: themeColors.textSecondary }}>
              Timeline Inspector
            </h4>
            <p style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Select a workflow pipeline from the left table to inspect its real-time approval stages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
