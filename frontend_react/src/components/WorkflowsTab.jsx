import { useState, useEffect } from "react";
import axios from "axios";
import { getWorkflowRules, createWorkflowRule, deleteWorkflowRule, getWorkflowLogs, approveWorkflowLog, getTeams } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";
import EmptyState from "./EmptyState";
import { Zap, Play, CheckCircle, XCircle, Clock } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function WorkflowsTab({ apiKey, selectedTeam }) {
  const [tabMode, setTabMode] = useState("run"); // 'run' or 'rules'
  
  // Rules States
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [teams, setTeams] = useState(["General"]);
  const [ruleName, setRuleName] = useState("");
  const [condValue, setCondValue] = useState("50");
  const [actionType, setActionType] = useState("log_alert");
  const [actionTarget, setActionTarget] = useState("");
  const [ruleTeam, setRuleTeam] = useState("General");
  
  // Run Workflows States
  const [workflows, setWorkflows] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("Purchase Request");
  const [requester, setRequester] = useState("Jessica Chen");
  const [wfFields, setWfFields] = useState({
    item_name: "MacBook Pro Pro",
    amount: "2499",
    justification: "Required for engineering compile workloads",
    destination: "San Francisco, CA",
    purpose: "Attend Hackathon Demo Day",
    estimated_cost: "1200",
    date: new Date().toISOString().split('T')[0],
    leave_type: "Annual",
    days_requested: "5",
    employee_name: "Arjun Mehta",
    department: "Engineering",
    role: "Senior Full Stack Dev",
    document_title: "Product Specs Brief",
    reason: "New employment opportunities"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rejectingInstanceId, setRejectingInstanceId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Rules & Logs
      const rulesData = await getWorkflowRules();
      setRules(rulesData);
      
      const logsData = await getWorkflowLogs();
      setLogs(logsData);
      
      const teamsData = await getTeams();
      setTeams(teamsData.map(t => t.name || t));

      // Active Workflows instances
      const resDash = await axios.get(`${API_BASE_URL}/api/dashboard`);
      setWorkflows(resDash.data.workflows || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load workflow data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tabMode]);

  const handleFieldChange = (key, val) => {
    setWfFields(prev => ({ ...prev, [key]: val }));
  };

  const handleStartWorkflow = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    // Package input data based on template
    let inputData = { requester };
    if (selectedTemplate === "Purchase Request") {
      inputData.item_name = wfFields.item_name;
      inputData.amount = parseFloat(wfFields.amount) || 0;
      inputData.justification = wfFields.justification;
      inputData.department = wfFields.department;
    } else if (selectedTemplate === "Travel Request") {
      inputData.destination = wfFields.destination;
      inputData.purpose = wfFields.purpose;
      inputData.estimated_cost = parseFloat(wfFields.estimated_cost) || 0;
      inputData.date = wfFields.date;
    } else if (selectedTemplate === "Leave Approval") {
      inputData.leave_type = wfFields.leave_type;
      inputData.days_requested = parseInt(wfFields.days_requested) || 1;
      inputData.justification = wfFields.justification;
    } else if (selectedTemplate === "Employee Onboarding") {
      inputData.employee_name = wfFields.employee_name;
      inputData.department = wfFields.department;
      inputData.role = wfFields.role;
    } else if (selectedTemplate === "Document Approval") {
      inputData.document_title = wfFields.document_title;
      inputData.purpose = wfFields.justification;
    } else if (selectedTemplate === "Employee Offboarding") {
      inputData.employee_name = wfFields.employee_name;
      inputData.departure_date = wfFields.date;
      inputData.reason = wfFields.reason;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/workflow/start`, {
        template_name: selectedTemplate,
        input_data: inputData,
        api_key: apiKey || null
      });
      setSuccess(`✓ Workflow started: ${selectedTemplate} (Instance ID: ${res.data.instance_id})`);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to start workflow.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStep = async (instanceId, approver) => {
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/api/workflow/approve`, {
        instance_id: instanceId,
        approver: approver,
        api_key: apiKey || null
      });
      setSuccess(`✓ Step approved successfully.`);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to approve step.");
    }
  };

  const handleRejectStep = async (instanceId, rejecter) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/api/workflow/reject`, {
        instance_id: instanceId,
        rejecter: rejecter,
        reason: rejectReason.trim(),
        api_key: apiKey || null
      });
      setSuccess(`✓ Step rejected successfully.`);
      setRejectingInstanceId(null);
      setRejectReason("");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to reject step.");
    }
  };

  // Rules Handlers
  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    setError("");
    setSuccess("");
    try {
      await createWorkflowRule({
        name: ruleName.trim(),
        condition_type: "confidence_below",
        condition_value: condValue,
        action_type: actionType,
        action_target: actionTarget.trim() || null,
        team_id: ruleTeam
      });
      setSuccess(`✓ Rule '${ruleName.trim()}' created!`);
      setRuleName("");
      setActionTarget("");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create rule.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteWorkflowRule(ruleId);
      loadData();
    } catch (err) {
      alert("Failed to delete rule: " + (err?.response?.data?.detail || ""));
    }
  };

  const handleApproveLog = async (logId) => {
    try {
      await approveWorkflowLog(logId);
      loadData();
    } catch (err) {
      alert("Failed to approve action: " + (err?.response?.data?.detail || ""));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sub-Tabs switcher */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
        <button
          onClick={() => setTabMode("run")}
          style={{
            background: tabMode === "run" ? "rgba(201, 162, 39, 0.12)" : "transparent",
            color: tabMode === "run" ? themeColors.textPrimary : themeColors.textSecondary,
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: typography.body.fontFamily
          }}
        >
          ⚡ Run Workflows
        </button>
        <button
          onClick={() => setTabMode("rules")}
          style={{
            background: tabMode === "rules" ? "rgba(201, 162, 39, 0.12)" : "transparent",
            color: tabMode === "rules" ? themeColors.textPrimary : themeColors.textSecondary,
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: typography.body.fontFamily
          }}
        >
          🛡️ Confidence Observability Rules
        </button>
      </div>

      {error && (
        <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: themeColors.confidenceHigh, padding: "1rem", border: `1px solid ${themeColors.confidenceHigh}33`, borderRadius: "8px", background: "rgba(52, 211, 153, 0.05)" }}>
          {success}
        </div>
      )}

      {/* A. RUN WORKFLOWS MODE */}
      {tabMode === "run" && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Start Workflow Form */}
          <div style={{ ...cardStyle, flex: "1 1 320px", marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0 }}>🚀 Trigger Agent Workflow</h3>
            <form onSubmit={handleStartWorkflow} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Workflow Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem", background: "#1A1A1A" }}
                  >
                    <option value="Purchase Request">Purchase Request</option>
                    <option value="Travel Request">Travel Request</option>
                    <option value="Leave Approval">Leave Approval</option>
                    <option value="Employee Onboarding">Employee Onboarding</option>
                    <option value="Document Approval">Document Approval</option>
                    <option value="Employee Offboarding">Employee Offboarding</option>
                  </select>
                </div>
                <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Requester</label>
                  <input
                    type="text"
                    value={requester}
                    onChange={(e) => setRequester(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Inputs based on Template */}
              {selectedTemplate === "Purchase Request" && (
                <>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Item / Service</label>
                      <input type="text" value={wfFields.item_name} onChange={e => handleFieldChange("item_name", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Amount ($)</label>
                      <input type="number" value={wfFields.amount} onChange={e => handleFieldChange("amount", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Justification</label>
                    <textarea value={wfFields.justification} onChange={e => handleFieldChange("justification", e.target.value)} rows={3} style={{ ...inputStyle, padding: "0.5rem", resize: "vertical" }} required />
                  </div>
                </>
              )}

              {selectedTemplate === "Travel Request" && (
                <>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Destination</label>
                      <input type="text" value={wfFields.destination} onChange={e => handleFieldChange("destination", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Est. Cost ($)</label>
                      <input type="number" value={wfFields.estimated_cost} onChange={e => handleFieldChange("estimated_cost", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Purpose</label>
                      <input type="text" value={wfFields.purpose} onChange={e => handleFieldChange("purpose", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                    <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Departure Date</label>
                      <input type="date" value={wfFields.date} onChange={e => handleFieldChange("date", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                </>
              )}

              {selectedTemplate === "Leave Approval" && (
                <>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Leave Type</label>
                      <select value={wfFields.leave_type} onChange={e => handleFieldChange("leave_type", e.target.value)} style={{ ...inputStyle, padding: "0.5rem", background: "#1A1A1A" }}>
                        <option value="Annual">Annual Leave</option>
                        <option value="Sick">Sick Leave</option>
                        <option value="Unpaid">Unpaid Personal</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>No. of Days</label>
                      <input type="number" value={wfFields.days_requested} onChange={e => handleFieldChange("days_requested", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Reason / Justification</label>
                    <textarea value={wfFields.justification} onChange={e => handleFieldChange("justification", e.target.value)} rows={3} style={{ ...inputStyle, padding: "0.5rem", resize: "vertical" }} required />
                  </div>
                </>
              )}

              {selectedTemplate === "Employee Onboarding" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Employee Name</label>
                    <input type="text" value={wfFields.employee_name} onChange={e => handleFieldChange("employee_name", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Department</label>
                      <input type="text" value={wfFields.department} onChange={e => handleFieldChange("department", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Role Title</label>
                      <input type="text" value={wfFields.role} onChange={e => handleFieldChange("role", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                </>
              )}

              {selectedTemplate === "Document Approval" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Document Title</label>
                    <input type="text" value={wfFields.document_title} onChange={e => handleFieldChange("document_title", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Purpose / Description</label>
                    <textarea value={wfFields.justification} onChange={e => handleFieldChange("justification", e.target.value)} rows={3} style={{ ...inputStyle, padding: "0.5rem", resize: "vertical" }} required />
                  </div>
                </>
              )}

              {selectedTemplate === "Employee Offboarding" && (
                <>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Employee Name</label>
                      <input type="text" value={wfFields.employee_name} onChange={e => handleFieldChange("employee_name", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                    <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Departure Date</label>
                      <input type="date" value={wfFields.date} onChange={e => handleFieldChange("date", e.target.value)} style={{ ...inputStyle, padding: "0.5rem" }} required />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Reason</label>
                    <textarea value={wfFields.reason} onChange={e => handleFieldChange("reason", e.target.value)} rows={3} style={{ ...inputStyle, padding: "0.5rem", resize: "vertical" }} required />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
                {loading ? "Starting Workflow..." : "✨ Dispatch Autonomous Stepper"}
              </button>
            </form>
          </div>

          {/* Active Workflows Monitor (Stepper Logs) */}
          <div style={{ ...cardStyle, flex: "1.8 1 400px", marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>📡 Active Steppers Log</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto" }}>
              {workflows.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title="No active workflows"
                  description="Start a multi-step workflow on the left to track its live authorization sequence."
                />
              ) : (
                workflows.map((wf) => {
                  const isDone = wf.status === "completed";
                  const isFail = wf.status === "rejected";
                  const stepsArray = Array.isArray(wf.steps) ? wf.steps : (typeof wf.steps === "string" ? JSON.parse(wf.steps) : []);
                  const curStepIdx = wf.current_step_index || 0;
                  
                  return (
                    <div key={wf.id} style={{ background: "#1A1A1A", border: `1px solid ${isFail ? "rgba(239,91,91,0.2)" : isDone ? "rgba(52,211,153,0.2)" : themeColors.borderDivider}`, borderRadius: "10px", padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{wf.template_name} (ID: #{wf.id})</span>
                          <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.2rem" }}>
                            Started: {new Date(wf.created_at).toLocaleString()} | Requester: <strong>{wf.input_data?.requester || "Jessica Chen"}</strong>
                          </div>
                        </div>
                        <span style={{
                          ...pillStyle,
                          background: isDone ? "rgba(52,211,153,0.15)" : isFail ? "rgba(239,91,91,0.15)" : "rgba(201,162,39,0.15)",
                          color: isDone ? themeColors.confidenceHigh : isFail ? themeColors.confidenceLow : themeColors.highlightAmber
                        }}>
                          {wf.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Display Data context */}
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "0.8rem" }}>
                        {selectedTemplate === "Purchase Request" && wf.input_data?.item_name && (
                          <div>Item: <strong>{wf.input_data.item_name}</strong> | Cost: <strong>${wf.input_data.amount}</strong> | Justify: <em>{wf.input_data.justification}</em></div>
                        )}
                        {selectedTemplate === "Travel Request" && wf.input_data?.destination && (
                          <div>Dest: <strong>{wf.input_data.destination}</strong> | Cost: <strong>${wf.input_data.estimated_cost}</strong> | Purpose: <em>{wf.input_data.purpose}</em></div>
                        )}
                        {(!wf.input_data?.item_name && !wf.input_data?.destination) && (
                          <div>Data: <code>{JSON.stringify(wf.input_data)}</code></div>
                        )}
                      </div>

                      {/* Interactive Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: "1rem 0", overflowX: "auto", paddingBottom: "0.25rem" }}>
                        {stepsArray.map((step, idx) => {
                          const stepDone = idx < curStepIdx || isDone;
                          const stepActive = idx === curStepIdx && !isDone && !isFail;
                          const stepReject = isFail && idx === curStepIdx;
                          
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.3rem 0.6rem",
                                borderRadius: "20px",
                                background: stepDone ? "rgba(52, 211, 153, 0.12)" : stepActive ? "rgba(201, 162, 39, 0.15)" : stepReject ? "rgba(239, 91, 91, 0.15)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${stepDone ? themeColors.confidenceHigh : stepActive ? themeColors.highlightAmber : stepReject ? themeColors.confidenceLow : themeColors.borderDivider}`,
                                color: stepDone ? themeColors.confidenceHigh : stepActive ? themeColors.highlightAmber : stepReject ? themeColors.confidenceLow : themeColors.textSecondary,
                                fontSize: "0.75rem",
                                fontWeight: (stepActive || stepReject) ? "bold" : "normal",
                                whiteSpace: "nowrap"
                              }}>
                                {stepDone && <CheckCircle size={12} />}
                                {stepActive && <Clock size={12} />}
                                {stepReject && <XCircle size={12} />}
                                <span>{step}</span>
                              </div>
                              {idx < stepsArray.length - 1 && (
                                <span style={{ color: themeColors.borderDivider }}>&rarr;</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Reject Reason input if active */}
                      {rejectingInstanceId === wf.id && (
                        <div style={{ background: "rgba(239,91,91,0.05)", border: `1px solid ${themeColors.confidenceLow}44`, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.8rem" }}>
                          <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, display: "block", marginBottom: "0.3rem" }}>Rejection Justification</span>
                          <input
                            type="text"
                            placeholder="e.g. Budget limitations, please purchase cheaper alternative."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ ...inputStyle, padding: "0.4rem", fontSize: "0.8rem", marginBottom: "0.5rem" }}
                          />
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                            <button onClick={() => setRejectingInstanceId(null)} style={{ background: "transparent", border: "none", color: themeColors.textSecondary, cursor: "pointer", fontSize: "0.75rem" }}>Cancel</button>
                            <button onClick={() => handleRejectStep(wf.id, "Manager Approval")} style={{ background: themeColors.confidenceLow, border: "none", color: themeColors.bgBase, cursor: "pointer", borderRadius: "4px", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: "bold" }}>Confirm Reject</button>
                          </div>
                        </div>
                      )}

                      {/* Stepper Actions */}
                      {!isDone && !isFail && rejectingInstanceId !== wf.id && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "0.6rem", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Waiting for: <strong>{stepsArray[curStepIdx]}</strong></span>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              onClick={() => setRejectingInstanceId(wf.id)}
                              style={{ background: "rgba(239, 91, 91, 0.15)", border: "none", color: themeColors.confidenceLow, cursor: "pointer", borderRadius: "4px", padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Reject Step
                            </button>
                            <button
                              onClick={() => handleApproveStep(wf.id, "Manager Approval")}
                              style={{ background: "rgba(52, 211, 153, 0.15)", border: "none", color: themeColors.confidenceHigh, cursor: "pointer", borderRadius: "4px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: "bold" }}
                            >
                              Approve Step
                            </button>
                          </div>
                        </div>
                      )}

                      {isFail && wf.rejection_reason && (
                        <div style={{ color: themeColors.confidenceLow, fontSize: "0.8rem", marginTop: "0.4rem", fontStyle: "italic" }}>
                          Rejection Reason: &ldquo;{wf.rejection_reason}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. RULES CONFIGURATION MODE */}
      {tabMode === "rules" && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Create Rule Form */}
          <div style={{ ...cardStyle, flex: "1 1 300px", marginTop: 0 }}>
            <h4 style={{ ...sectionLabelStyle, marginBottom: "0.75rem" }}>Create Monitor Rule</h4>
            <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Layoff Warning"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem 0.75rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Trigger Condition</label>
                  <select
                    style={{ ...inputStyle, padding: "0.5rem" }}
                    disabled
                  >
                    <option>Confidence Below</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={condValue}
                    onChange={(e) => setCondValue(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                  >
                    <option value="log_alert">Log Alert (Low Risk)</option>
                    <option value="notify_expert">Notify Expert (Low Risk)</option>
                    <option value="flag_risk">Flag Risk (High Risk - Review Required)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Target Person / Node</label>
                  <input
                    type="text"
                    placeholder="e.g. Deepak Rao"
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Scope Team</label>
                <select
                  value={ruleTeam}
                  onChange={(e) => setRuleTeam(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem" }}
                >
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button type="submit" style={{ ...buttonStyle, marginTop: "0.5rem" }}>
                Activate Rule
              </button>
            </form>
          </div>

          {/* Active Rules List */}
          <div style={{ ...cardStyle, flex: "1.5 1 350px", marginTop: 0 }}>
            <h4 style={sectionLabelStyle}>Active Rules</h4>
            {loading && rules.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Loading active rules...</p>
            ) : rules.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No active rules"
                description="Create rule conditions above to trigger automatic actions based on copilot queries."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      background: themeColors.panelSurfaceRaised,
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: themeColors.textPrimary }}>{rule.name}</div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Condition: <code style={{ fontFamily: typography.mono.fontFamily }}>confidence &lt; {rule.condition_value}%</code> | Team: <code style={{ fontFamily: typography.mono.fontFamily }}>{rule.team_id}</code>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.highlightAmber, marginTop: "0.15rem" }}>
                        Action: <strong>{rule.action_type}</strong> {rule.action_target && `(Target: ${rule.action_target})`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{
                        background: "rgba(239, 91, 91, 0.1)",
                        border: "none",
                        color: themeColors.confidenceLow,
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trigger Logs list */}
          <div style={{ ...cardStyle, width: "100%", marginTop: "1rem" }}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
              Confidence Rule Triggers Audit Log
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
              Lists RAG confidence alerts. Items requiring Review block until authorized.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "300px", overflowY: "auto" }}>
              {logs.map((log) => {
                const isPending = log.status === "pending_review";
                return (
                  <div key={log.id} style={{ background: "#1A1A1A", border: `1px solid ${isPending ? "rgba(201,162,39,0.3)" : themeColors.borderDivider}`, borderRadius: "10px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600 }}>Rule: {log.rule_name}</span>
                        <span style={{ ...pillStyle, fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>{log.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Query: &ldquo;{log.query}&rdquo; (Confidence: {log.confidence_score}%)
                      </div>
                      <div style={{ fontSize: "0.85rem", color: themeColors.textPrimary }}>Action: {log.action_executed}</div>
                    </div>
                    {isPending && (
                      <button onClick={() => handleApproveLog(log.id)} style={{ ...buttonStyle, marginTop: 0, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Authorize Action</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
