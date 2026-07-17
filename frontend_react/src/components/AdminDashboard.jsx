import { useState, useEffect } from "react";
import axios from "axios";
import { getTeams, createTeam, listDocuments, deleteDocument, assignDocumentTeam, getWorkflowRules, getWorkflowLogs } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

const AGENT_LIST = [
  { id: "knowledge", name: "Knowledge Agent", description: "Performs RAG over indexed documents." },
  { id: "meeting", name: "Meeting Agent", description: "Transcribes audio and extracts MOM/action tasks." },
  { id: "email", name: "Email Agent", description: "Generates professional corporate email drafts." },
  { id: "report", name: "Report Agent", description: "Compiles weekly, monthly, and metric reports." },
  { id: "workflow", name: "Workflow Agent", description: "Coordinates and executes multi-step templates." },
  { id: "risk", name: "Risk Agent", description: "Evaluates situations against policies for warnings." },
  { id: "recommendation", name: "Recommendation Agent", description: "Suggests next steps and related resources." }
];

export default function AdminDashboard() {
  const [subTab, setSubTab] = useState("analytics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);

  // Teams State
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  
  // Documents State
  const [docs, setDocs] = useState([]);
  const [docTeamMap, setDocTeamMap] = useState({});

  // Editing Document State
  const [editingDoc, setEditingDoc] = useState(null); // { filename, content, team_id, department, owner }
  const [editContent, setEditContent] = useState("");
  const [editDept, setEditDept] = useState("General");
  const [editOwner, setEditOwner] = useState("General");
  const [editTeam, setEditTeam] = useState("General");

  // Support Tickets State
  const [tickets, setTickets] = useState([]);

  // Models State
  const [activeModel, setActiveModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState(0.3);

  // Active Agents State
  const [enabledAgents, setEnabledAgents] = useState({
    knowledge: true,
    meeting: true,
    email: true,
    report: true,
    workflow: true,
    risk: true,
    recommendation: true
  });

  // Logs & Workflows State
  const [workflowLogs, setWorkflowLogs] = useState([]);
  const [activities, setActivities] = useState([]);

  // Mock Users State
  const [users, setUsers] = useState([
    { id: 1, name: "Jessica Chen", role: "HR Operations Lead", team: "HR Operations" },
    { id: 2, name: "Deepak Rao", role: "Finance Director", team: "General" },
    { id: 3, name: "Arjun Mehta", role: "IT Infrastructure Lead", team: "Engineering" },
    { id: 4, name: "Veera", role: "Administrator", team: "General" }
  ]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("");
  const [newUserTeam, setNewUserTeam] = useState("General");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Load Analytics
      const resAnal = await axios.get(`${API_BASE_URL}/api/analytics`);
      setAnalytics(resAnal.data);

      // Load Teams
      const resTeams = await getTeams();
      setTeams(resTeams.map(t => t.name || t));

      // Load Docs
      const resDocs = await listDocuments();
      setDocs(resDocs);
      
      const mapping = {};
      resDocs.forEach(d => {
        mapping[d.filename] = d.team_id || "General";
      });
      setDocTeamMap(mapping);

      // Load Tickets
      const resTickets = await axios.get(`${API_BASE_URL}/api/tickets`);
      setTickets(resTickets.data);

      // Load Workflows Logs
      const resWfLogs = await getWorkflowLogs();
      setWorkflowLogs(resWfLogs);

      // Load Activities Logs
      const resAct = await axios.get(`${API_BASE_URL}/api/activity`);
      setActivities(resAct.data);

    } catch (err) {
      console.error(err);
      setError("Failed to load admin dashboard specifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.trim()) return;
    try {
      await createTeam(newTeam.trim());
      setNewTeam("");
      loadData();
      alert("✓ Team created successfully!");
    } catch (err) {
      alert("Failed to create team: " + (err.response?.data?.detail || ""));
    }
  };

  const handleDocTeamChange = async (filename, teamId) => {
    try {
      await assignDocumentTeam(filename, teamId);
      setDocTeamMap(prev => ({ ...prev, [filename]: teamId }));
      alert(`✓ Document '${filename}' reassigned to team '${teamId}'`);
    } catch (err) {
      alert("Failed to reassign document: " + (err.response?.data?.detail || ""));
    }
  };

  const handleDeleteDoc = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete '${filename}'?`)) return;
    try {
      await deleteDocument(filename);
      loadData();
    } catch (err) {
      alert("Failed to delete document: " + (err.response?.data?.detail || ""));
    }
  };

  const handleStartEdit = async (doc) => {
    if (!doc.filename.endsWith(".txt")) {
      alert("Only text (.txt) files can be edited directly in the browser.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/documents/${encodeURIComponent(doc.filename)}/content`);
      setEditingDoc(doc);
      setEditContent(res.data.content);
      setEditDept(doc.department || "General");
      setEditOwner(doc.owner || "General");
      setEditTeam(doc.team_id || "General");
    } catch (err) {
      alert("Failed to load document content: " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/documents/edit`, {
        filename: editingDoc.filename,
        content: editContent,
        team_id: editTeam,
        department: editDept,
        owner: editOwner
      });
      alert(`✓ Document '${editingDoc.filename}' updated and vector index re-built.`);
      setEditingDoc(null);
      loadData();
    } catch (err) {
      alert("Failed to save changes: " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/api/tickets/${ticketId}/status`, { status });
      alert(`✓ Ticket #${ticketId} status updated to: ${status}`);
      loadData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || ""));
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserRole.trim()) return;
    const newU = {
      id: users.length + 1,
      name: newUserName.trim(),
      role: newUserRole.trim(),
      team: newUserTeam
    };
    setUsers(prev => [...prev, newU]);
    setNewUserName("");
    setNewUserRole("");
    alert(`✓ User '${newU.name}' added successfully!`);
  };

  const handleRemoveUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const toggleAgent = (agentId) => {
    setEnabledAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  // Filter feedback events from logs
  const feedbackLogs = activities.filter(act => act.activity_type.toLowerCase() === "rating" || act.activity_type.toLowerCase() === "feedback");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: `1px solid ${themeColors.borderDivider}`,
          paddingBottom: "0.75rem",
          marginBottom: "0.5rem",
          overflowX: "auto"
        }}
      >
        {[
          { id: "analytics", label: "📊 System Analytics" },
          { id: "users", label: "👥 Users & Teams" },
          { id: "documents", label: "📁 Document Index" },
          { id: "tickets", label: "🎟️ Support Tickets Console" },
          { id: "models", label: "⚙️ LLM Models" },
          { id: "agents", label: "🤖 AI Agents" },
          { id: "logs", label: "📑 Logs & Feedback" }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setSubTab(sub.id); setEditingDoc(null); }}
            style={{
              background: subTab === sub.id ? "rgba(201, 162, 39, 0.12)" : "transparent",
              color: subTab === sub.id ? themeColors.textPrimary : themeColors.textSecondary,
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.2rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: typography.body.fontFamily,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap"
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)" }}>
          {error}
        </div>
      )}

      {/* 1. Analytics Screen */}
      {subTab === "analytics" && analytics && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.textPrimary }}>{analytics.documents_uploaded}</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Total Documents</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.textPrimary }}>{analytics.knowledge_queries}</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Queries Today</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.textPrimary }}>{tickets.length}</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Active Tickets</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.textPrimary }}>320ms</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Avg Latency</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: themeColors.confidenceHigh }}>{analytics.accuracy}%</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>Coverage Index</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
              <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>Queries Activity (Daily)</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "0 1rem" }}>
                {analytics.daily_activity.map(d => (
                  <div key={d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "10%" }}>
                    <div style={{ width: "100%", height: `${d.queries * 4}px`, background: "linear-gradient(180deg, #C9A227 0%, #232323 100%)", borderRadius: "4px" }} />
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.4rem" }}>{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
              <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>Document Upload Trends</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "150px", padding: "0 1rem" }}>
                {analytics.monthly_activity.map(m => (
                  <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12%" }}>
                    <div style={{ width: "100%", height: `${m.saved * 1.2}px`, background: "linear-gradient(180deg, #C9A227 0%, #232323 100%)", borderRadius: "4px" }} />
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.4rem" }}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Users & Teams Screen */}
      {subTab === "users" && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ ...cardStyle, flex: "1.5 1 400px", marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem" }}>Manage Users</h3>
            <form onSubmit={handleAddUser} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.7rem", color: themeColors.textSecondary }}>Name</span>
                <input type="text" placeholder="User Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} required />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.7rem", color: themeColors.textSecondary }}>Role</span>
                <input type="text" placeholder="Role Description" value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} required />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.7rem", color: themeColors.textSecondary }}>Team</span>
                <select value={newUserTeam} onChange={e => setNewUserTeam(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#1A1A1A" }}>
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{ ...buttonStyle, marginTop: 0, padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Add User</button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {users.map(u => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "8px", padding: "0.6rem 0.8rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.name}</div>
                    <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>{u.role} | Team: <code style={{ fontFamily: typography.mono.fontFamily }}>{u.team}</code></div>
                  </div>
                  {u.id !== 4 && (
                    <button onClick={() => handleRemoveUser(u.id)} style={{ background: "rgba(239, 91, 91, 0.15)", border: "none", color: themeColors.confidenceLow, borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: "1 1 300px", marginTop: 0 }}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem" }}>Manage Teams</h3>
            <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <input type="text" placeholder="New Team Name" value={newTeam} onChange={e => setNewTeam(e.target.value)} style={{ ...inputStyle, padding: "0.5rem 0.8rem", fontSize: "0.9rem" }} required />
              <button type="submit" style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem" }}>Create Team</button>
            </form>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {teams.map(t => (
                <span key={t} style={{ ...pillStyle, color: themeColors.highlightAmber, background: "rgba(201, 162, 39, 0.1)", border: `1px solid ${themeColors.highlightAmber}44`, fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>👥 {t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Document Index & Editing Screen */}
      {subTab === "documents" && (
        <div style={cardStyle}>
          {editingDoc ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ ...typography.heading, fontSize: "1.3rem", margin: 0 }}>✏️ Edit Document: {editingDoc.filename}</h3>
                <button onClick={() => setEditingDoc(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: themeColors.textPrimary, padding: "0.3rem 0.75rem", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              </div>
              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Department Scope</span>
                    <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)} style={inputStyle} required />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Document Owner</span>
                    <input type="text" value={editOwner} onChange={e => setEditOwner(e.target.value)} style={inputStyle} required />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Team Access</span>
                    <select value={editTeam} onChange={e => setEditTeam(e.target.value)} style={{ ...inputStyle, background: "#1A1A1A" }}>
                      {teams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>File Content Text</span>
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{ ...inputStyle, fontFamily: typography.mono.fontFamily, fontSize: "0.85rem", lineHeight: 1.4, resize: "vertical" }}
                    required
                  />
                </div>

                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? "Saving and Re-indexing..." : "Save and Re-Index Embeddings"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem" }}>Manage Indexed Documents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto" }}>
                {docs.map(d => (
                  <div key={d.filename} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "8px", padding: "0.8rem 1rem" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>📄 {d.filename}</div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Chunks: {d.chunk_count} | Dept: {d.department || "General"} | Owner: {d.owner || "General"}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ fontSize: "0.65rem", color: themeColors.textSecondary }}>Team Scope</span>
                        <select
                          value={docTeamMap[d.filename] || "General"}
                          onChange={(e) => handleDocTeamChange(d.filename, e.target.value)}
                          style={{ padding: "0.3rem 0.5rem", borderRadius: "6px", background: "#1A1A1A", color: themeColors.textPrimary, border: `1px solid ${themeColors.borderDivider}` }}
                        >
                          {teams.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {d.filename.endsWith(".txt") && (
                        <button onClick={() => handleStartEdit(d)} style={{ background: "rgba(201, 162, 39, 0.15)", border: "none", color: themeColors.highlightAmber, borderRadius: "6px", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                      )}
                      <button onClick={() => handleDeleteDoc(d.filename)} style={{ background: "rgba(239, 91, 91, 0.15)", border: "none", color: themeColors.confidenceLow, borderRadius: "6px", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Customer Support Tickets Console Screen */}
      {subTab === "tickets" && (
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>🎫 Customer Support Tickets</h3>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>Manage tickets raised by the support assistant RAG workflow. Resolving or escalating tickets adjusts customer records.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto" }}>
            {tickets.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic", textAlign: "center", padding: "2rem" }}>No tickets raised in system.</p>
            ) : (
              tickets.map(t => {
                const isEsc = t.status === "escalated";
                const isOp = t.status === "open";
                return (
                  <div key={t.id} style={{ background: "#1A1A1A", border: `1px solid ${isEsc ? "rgba(239, 91, 91, 0.25)" : themeColors.borderDivider}`, borderRadius: "10px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Ticket #{t.id}: {t.summary}</span>
                        <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.2rem" }}>
                          Intent: <strong>{t.category || t.intent || "General"}</strong> | Sentiment: <strong>{t.sentiment}</strong> | Priority: <strong style={{ color: t.priority === "critical" || t.priority === "high" ? themeColors.confidenceLow : themeColors.textPrimary }}>{t.priority}</strong>
                        </div>
                      </div>
                      <span style={{ ...pillStyle, background: isEsc ? "rgba(239,91,91,0.15)" : isOp ? "rgba(201,162,39,0.15)" : "rgba(52,211,153,0.15)", color: isEsc ? themeColors.confidenceLow : isOp ? themeColors.highlightAmber : themeColors.confidenceHigh }}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: themeColors.textSecondary, margin: "0.4rem 0" }}><strong>User Inquiry:</strong> &ldquo;{t.query}&rdquo;</p>
                    <p style={{ fontSize: "0.85rem", color: themeColors.textPrimary, margin: "0.4rem 0" }}><strong>AI Prepared Answer:</strong> {t.answer}</p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "0.6rem" }}>
                      <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Created: {t.created_at}</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {t.status !== "resolved" && (
                          <button onClick={() => handleUpdateTicketStatus(t.id, "resolved")} style={{ background: "rgba(52,211,153,0.15)", border: "none", color: themeColors.confidenceHigh, cursor: "pointer", borderRadius: "4px", padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>Resolve Ticket</button>
                        )}
                        {!isEsc && t.status !== "resolved" && (
                          <button onClick={() => handleUpdateTicketStatus(t.id, "escalated")} style={{ background: "rgba(239,91,91,0.15)", border: "none", color: themeColors.confidenceLow, cursor: "pointer", borderRadius: "4px", padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>Escalate</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Models Configuration Screen */}
      {subTab === "models" && (
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1.5rem" }}>Configure AI Models</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "500px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>Primary LLM Model (Reasoning & Orchestrator)</label>
              <select value={activeModel} onChange={e => setActiveModel(e.target.value)} style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Production Default)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Fast response)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (Complex pipelines)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>Voice-to-Text Model (Meetings)</label>
              <select disabled style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A", opacity: 0.7 }}>
                <option value="whisper-large-v3">Whisper Large v3 (Multilingual support)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.8rem", color: themeColors.textSecondary }}>Agent Temperature (Creativity)</label>
                <span style={{ fontFamily: typography.mono.fontFamily, color: themeColors.highlightAmber }}>{temperature}</span>
              </div>
              <input type="range" min="0.0" max="1.0" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} style={{ cursor: "pointer", accentColor: themeColors.highlightAmber }} />
            </div>

            <button onClick={() => alert(`✓ Model configuration updated: Model set to ${activeModel}, Temp set to ${temperature}.`)} style={{ ...buttonStyle, width: "fit-content" }}>Save Model Parameters</button>
          </div>
        </div>
      )}

      {/* 6. AI Agents Screen */}
      {subTab === "agents" && (
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>Autonomous Agent Grid</h3>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.5rem 0" }}>Enable, disable, or adjust execution parameters for specific AI agents in the copilot orchestrator.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {AGENT_LIST.map(agent => (
              <div key={agent.id} style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>{agent.name}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: enabledAgents[agent.id] ? themeColors.confidenceHigh : themeColors.textSecondary }}>{enabledAgents[agent.id] ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                  <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: 0, lineHeight: 1.4 }}>{agent.description}</p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button onClick={() => toggleAgent(agent.id)} style={{ flex: 1, background: enabledAgents[agent.id] ? "rgba(239, 91, 91, 0.15)" : "rgba(52, 211, 153, 0.15)", border: "none", color: enabledAgents[agent.id] ? themeColors.confidenceLow : enabledAgents[agent.id] ? themeColors.confidenceHigh : themeColors.confidenceHigh, padding: "0.3rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
                    {enabledAgents[agent.id] ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => alert(`Opening advanced parameters for ${agent.name}...`)} style={{ flex: 1, background: "rgba(255, 255, 255, 0.05)", border: `1px solid ${themeColors.borderDivider}`, color: themeColors.textPrimary, padding: "0.3rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>Configure</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Logs & Feedback Screen */}
      {subTab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* User Feedback Logs */}
          <div style={cardStyle}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>👍/👎 User Feedback Stream</h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>Shows response rating actions logged directly by employees.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto", background: "#1A1A1A", borderRadius: "10px", padding: "1rem", border: `1px solid ${themeColors.borderDivider}` }}>
              {feedbackLogs.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontStyle: "italic", textAlign: "center" }}>No rating feedback logged yet.</p>
              ) : (
                feedbackLogs.map((fb) => (
                  <div key={fb.id} style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.5rem", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: fb.description.includes("thumbs-up") ? themeColors.confidenceHigh : themeColors.confidenceLow }}>
                        {fb.description.includes("thumbs-up") ? "👍 THUMBS UP" : "👎 THUMBS DOWN"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontFamily: typography.mono.fontFamily }}>{new Date(fb.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: themeColors.textPrimary, margin: "0.2rem 0" }}>{fb.description}</div>
                    {fb.details && <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontStyle: "italic" }}>{fb.details}</div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity logs */}
          <div style={cardStyle}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>Copilot Action Stream (All Activities)</h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>Real-time database log of agent triggers, tool outputs, document updates, and email/report creations.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto", background: "#1A1A1A", borderRadius: "10px", padding: "1rem", border: `1px solid ${themeColors.borderDivider}` }}>
              {activities.map((act) => (
                <div key={act.id} style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.5rem", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: themeColors.highlightAmber }}>[{act.activity_type.toUpperCase()}]</span>
                    <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontFamily: typography.mono.fontFamily }}>{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ color: themeColors.textPrimary, margin: "0.2rem 0" }}>{act.description}</div>
                  {act.details && <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontStyle: "italic" }}>Details: {act.details}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
