import { useState, useEffect, useCallback } from "react";
import {
  submitLeaveRequest,
  getLeaveRequests,
  managerDecideLeave,
  hrDecideLeave
} from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, pillStyle } from "../styles";
import { CalendarPlus, CheckCircle2, XCircle, Clock, User, Users, ShieldCheck } from "lucide-react";
import EmptyState from "./EmptyState";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave", "Work From Home", "Unpaid Leave"];

// Every stage of the pipeline requires an explicit human decision - nothing here
// auto-approves. Employee submits -> Manager reviews -> HR gives the final call.
const STATUS_META = {
  pending_manager: { label: "Awaiting Manager Review", color: themeColors.confidenceMedium, bg: "rgba(245,158,11,0.08)" },
  pending_hr: { label: "Awaiting HR Approval", color: themeColors.confidenceMedium, bg: "rgba(245,158,11,0.08)" },
  approved: { label: "Approved", color: themeColors.success, bg: "rgba(16,185,129,0.08)" },
  rejected_manager: { label: "Rejected by Manager", color: themeColors.danger, bg: "rgba(239,68,68,0.08)" },
  rejected_hr: { label: "Rejected by HR", color: themeColors.danger, bg: "rgba(239,68,68,0.08)" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: themeColors.textSecondary, bg: "transparent" };
  return (
    <span style={{ ...pillStyle, color: meta.color, background: meta.bg, borderColor: "transparent", fontWeight: 600 }}>
      {meta.label}
    </span>
  );
}

function Timeline({ request }) {
  const steps = [
    { key: "submitted", label: "Submitted by employee", done: true },
    {
      key: "manager",
      label: request.status === "rejected_manager"
        ? `Rejected by manager${request.manager_comment ? `: "${request.manager_comment}"` : ""}`
        : "Reviewed by manager",
      done: request.status !== "pending_manager"
    },
    {
      key: "hr",
      label: request.status === "rejected_hr"
        ? `Rejected by HR${request.hr_comment ? `: "${request.hr_comment}"` : ""}`
        : request.status === "approved"
        ? "Approved by HR"
        : "Final HR decision",
      done: request.status === "approved" || request.status === "rejected_hr"
    }
  ];
  const stopped = request.status === "rejected_manager";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
      {steps.map((s, idx) => {
        if (stopped && idx === 2) return null;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: s.done ? themeColors.textPrimary : themeColors.textSecondary }}>
            {s.done ? (
              request.status.startsWith("rejected") && idx > 0 ? (
                <XCircle size={14} style={{ color: themeColors.danger }} />
              ) : (
                <CheckCircle2 size={14} style={{ color: themeColors.success }} />
              )
            ) : (
              <Clock size={14} style={{ color: themeColors.textSecondary }} />
            )}
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaveManagement({ role }) {
  const userEmail = sessionStorage.getItem("userEmail") || "";
  const userName = sessionStorage.getItem("userName") || "User";
  const userTeamId = sessionStorage.getItem("userTeamId") || "General";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0],
    start_date: "",
    end_date: "",
    reason: ""
  });

  const [decisionComment, setDecisionComment] = useState({});

  const fetchRequests = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError("");
    try {
      const data = await getLeaveRequests(role, userEmail);
      setRequests(data || []);
    } catch (e) {
      setError("Could not load leave requests.");
    } finally {
      setLoading(false);
    }
  }, [role, userEmail]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) {
      setError("Please select both a start and end date.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitLeaveRequest({ employee_email: userEmail, ...form });
      setForm({ leave_type: LEAVE_TYPES[0], start_date: "", end_date: "", reason: "" });
      fetchRequests();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagerDecision = async (id, decision) => {
    try {
      await managerDecideLeave(id, decision, decisionComment[id] || "", userEmail);
      fetchRequests();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to record decision.");
    }
  };

  const handleHrDecision = async (id, decision) => {
    try {
      await hrDecideLeave(id, decision, decisionComment[id] || "", userEmail);
      fetchRequests();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to record decision.");
    }
  };

  // ---------- EMPLOYEE VIEW ----------
  if (role === "Employee") {
    return (
      <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
        <div style={{ flex: "1 1 380px" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarPlus size={18} style={{ color: themeColors.accentPrimary }} />
              Apply for Leave
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Your request goes to <strong>{userTeamId}</strong>'s manager first, then to HR for the final decision.
            </p>

            {error && <div style={{ color: themeColors.danger, fontSize: "0.82rem", marginBottom: "1rem" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: themeColors.textSecondary, display: "block", marginBottom: "0.35rem" }}>Leave Type</label>
                <select
                  value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                  style={{ ...inputStyle, padding: "0.7rem 1rem" }}
                >
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.78rem", color: themeColors.textSecondary, display: "block", marginBottom: "0.35rem" }}>Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    style={{ ...inputStyle, padding: "0.7rem 1rem" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.78rem", color: themeColors.textSecondary, display: "block", marginBottom: "0.35rem" }}>End Date</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    style={{ ...inputStyle, padding: "0.7rem 1rem" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: themeColors.textSecondary, display: "block", marginBottom: "0.35rem" }}>Reason</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe why you need this leave..."
                  style={{ ...inputStyle, padding: "0.7rem 1rem", resize: "vertical", fontFamily: typography.body.fontFamily }}
                />
              </div>
              <button type="submit" disabled={submitting} style={{ ...buttonStyle, marginTop: "0.25rem", background: themeColors.accentPrimary, color: "#121212", border: "none" }}>
                {submitting ? "Submitting..." : "Submit for Manager Review"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ flex: "1.4 1 480px" }}>
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>My Leave Requests</h3>
            {loading ? (
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem" }}>Loading...</p>
            ) : requests.length === 0 ? (
              <EmptyState icon={CalendarPlus} title="No leave requests yet" description="Submit your first request using the form to the left." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {requests.map((r) => (
                  <div key={r.id} style={{ background: themeColors.panelSurfaceRaised, border: `1px solid ${themeColors.borderDivider}`, borderRadius: "12px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{r.leave_type}</strong>
                      <StatusPill status={r.status} />
                    </div>
                    <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>
                      {r.start_date} → {r.end_date}
                    </div>
                    {r.reason && <div style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>{r.reason}</div>}
                    <Timeline request={r} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- MANAGER VIEW ----------
  if (role === "Manager") {
    const pending = requests.filter((r) => r.status === "pending_manager");
    const decided = requests.filter((r) => r.status !== "pending_manager");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: themeColors.accentPrimary }} />
            Leave Requests — {userTeamId} Team
          </h3>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            You only see requests from your own team. Approving sends the request to HR for final sign-off; rejecting ends it here.
          </p>

          {loading ? (
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem" }}>Loading...</p>
          ) : pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing pending" description="No leave requests from your team are waiting on your review." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pending.map((r) => (
                <div key={r.id} style={{ background: themeColors.panelSurfaceRaised, border: `1px solid ${themeColors.borderDivider}`, borderRadius: "12px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "0.9rem" }}>{r.employee_name}</strong>
                      <span style={{ color: themeColors.textSecondary, fontSize: "0.8rem" }}> · {r.leave_type} · {r.start_date} → {r.end_date}</span>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  {r.reason && <div style={{ fontSize: "0.82rem", marginTop: "0.5rem", color: themeColors.textSecondary }}>"{r.reason}"</div>}
                  <input
                    type="text"
                    placeholder="Optional comment..."
                    value={decisionComment[r.id] || ""}
                    onChange={(e) => setDecisionComment({ ...decisionComment, [r.id]: e.target.value })}
                    style={{ ...inputStyle, padding: "0.5rem 0.85rem", fontSize: "0.82rem", marginTop: "0.75rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
                    <button onClick={() => handleManagerDecision(r.id, "approve")} style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.8rem", background: themeColors.success, color: "#fff", border: "none" }}>
                      Approve → Send to HR
                    </button>
                    <button onClick={() => handleManagerDecision(r.id, "reject")} style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.8rem", background: "transparent", color: themeColors.danger, border: `1px solid ${themeColors.danger}` }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {decided.length > 0 && (
          <div style={cardStyle}>
            <h4 style={{ ...typography.heading, fontSize: "1rem", marginTop: 0, marginBottom: "1rem" }}>Team History</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {decided.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", padding: "0.6rem 0", borderBottom: `1px solid ${themeColors.borderDivider}` }}>
                  <span>{r.employee_name} · {r.leave_type} · {r.start_date} → {r.end_date}</span>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- HR VIEW ----------
  const pendingHr = requests.filter((r) => r.status === "pending_hr");
  const others = requests.filter((r) => r.status !== "pending_hr");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      <div style={cardStyle}>
        <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={18} style={{ color: themeColors.accentPrimary }} />
          Leave Approvals — Final HR Decision
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          These requests have already been approved by the employee's manager and are waiting on you, across every team. There is no automatic approval — every request needs your sign-off.
        </p>

        {loading ? (
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem" }}>Loading...</p>
        ) : pendingHr.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing awaiting HR" description="No manager-approved leave requests are pending your final decision." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {pendingHr.map((r) => (
              <div key={r.id} style={{ background: themeColors.panelSurfaceRaised, border: `1px solid ${themeColors.borderDivider}`, borderRadius: "12px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{r.employee_name}</strong>
                    <span style={{ color: themeColors.textSecondary, fontSize: "0.8rem" }}> · {r.team_id} · {r.leave_type} · {r.start_date} → {r.end_date}</span>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                {r.reason && <div style={{ fontSize: "0.82rem", marginTop: "0.5rem", color: themeColors.textSecondary }}>Employee note: "{r.reason}"</div>}
                {r.manager_comment && <div style={{ fontSize: "0.82rem", marginTop: "0.25rem", color: themeColors.textPrimary }}>Manager note: "{r.manager_comment}"</div>}
                <input
                  type="text"
                  placeholder="Optional comment..."
                  value={decisionComment[r.id] || ""}
                  onChange={(e) => setDecisionComment({ ...decisionComment, [r.id]: e.target.value })}
                  style={{ ...inputStyle, padding: "0.5rem 0.85rem", fontSize: "0.82rem", marginTop: "0.75rem" }}
                />
                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
                  <button onClick={() => handleHrDecision(r.id, "approve")} style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.8rem", background: themeColors.success, color: "#fff", border: "none" }}>
                    Approve Leave
                  </button>
                  <button onClick={() => handleHrDecision(r.id, "reject")} style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.8rem", background: "transparent", color: themeColors.danger, border: `1px solid ${themeColors.danger}` }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ ...typography.heading, fontSize: "1rem", marginTop: 0, marginBottom: "1rem" }}>All Requests — Every Team</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.6rem" }}>Employee</th>
                  <th style={{ padding: "0.6rem" }}>Team</th>
                  <th style={{ padding: "0.6rem" }}>Type</th>
                  <th style={{ padding: "0.6rem" }}>Dates</th>
                  <th style={{ padding: "0.6rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {others.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${themeColors.borderDivider}` }}>
                    <td style={{ padding: "0.6rem" }}><User size={12} style={{ marginRight: "0.3rem", verticalAlign: "middle" }} />{r.employee_name}</td>
                    <td style={{ padding: "0.6rem", color: themeColors.textSecondary }}>{r.team_id}</td>
                    <td style={{ padding: "0.6rem" }}>{r.leave_type}</td>
                    <td style={{ padding: "0.6rem", color: themeColors.textSecondary }}>{r.start_date} → {r.end_date}</td>
                    <td style={{ padding: "0.6rem" }}><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
