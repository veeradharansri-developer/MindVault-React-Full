import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { askMindVault, notifyExpert, generatePPT, getDashboard, createTask, updateTaskStatus, getRecommendations, markNotificationRead } from "../api";
import { Search, Mail, FileText, Mic, FolderOpen, Zap, AlertTriangle, Lightbulb, CheckSquare, Activity } from "lucide-react";
import {
  inputStyle, buttonStyle, linkButtonStyle, cardStyle,
  sectionLabelStyle, pillStyle, confidenceStyle, themeColors, typography
} from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function CopilotDashboard({ apiKey, selectedTeam, setActiveNav }) {
  // Query / Chat State
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState("");
  const [notifiedExperts, setNotifiedExperts] = useState({});
  const [generatingPPT, setGeneratingPPT] = useState(false);
  const recognitionRef = useRef(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState(null);

  // Dashboard Data State
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [memory, setMemory] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Task creation state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const loadDashboardData = async () => {
    setDashLoading(true);
    try {
      const data = await getDashboard();
      setTasks(data.tasks || []);
      setNotifications(data.notifications || []);
      setMemory(data.memory || null);
      
      const actRes = await axios.get(`${API_BASE_URL}/api/activity`);
      setActivities(actRes.data || []);
    } catch (e) {
      console.error("Failed to load dashboard statistics", e);
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [result]);

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

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery((prev) => (prev ? prev + " " + transcript : transcript));
      };
      rec.onerror = (event) => {
        setListeningError("Error: " + event.error);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    }
  };

  async function handleAsk(e) {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRecommendations(null);
    setNotifiedExperts({});
    try {
      const data = await askMindVault(query, apiKey, selectedTeam);
      setResult(data);
      
      // Load AI suggestions for next tasks and recommendations
      const recData = await getRecommendations(query, data.answer, apiKey, selectedTeam);
      setRecommendations(recData);
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
      alert("Failed to generate PowerPoint slide.");
    } finally {
      setGeneratingPPT(false);
    }
  }

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      await updateTaskStatus(taskId, newStatus);
      loadDashboardData();
    } catch (err) {
      alert("Failed to update task: " + (err?.response?.data?.detail || ""));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        assigned_to: selectedTeam === "General" ? "General" : selectedTeam,
        priority: taskPriority,
        deadline: taskDeadline || null
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      setShowTaskForm(false);
      loadDashboardData();
      alert("✓ Task created successfully!");
    } catch (err) {
      alert("Failed to create task");
    }
  };

  const handleReadNotification = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAction = (actionId) => {
    if (actionId === "generate_email") setActiveNav("emails");
    else if (actionId === "generate_report") setActiveNav("reports");
    else if (actionId === "meeting_summary") setActiveNav("meetings");
    else if (actionId === "search_knowledge") {
      setQuery("Search: What is company leave policy?");
      document.getElementById("chat-textarea")?.focus();
    }
    else if (actionId === "upload_document") setActiveNav("documents");
    else if (actionId === "start_workflow") setActiveNav("workflows");
    else if (actionId === "risk_analysis") {
      setQuery("Check risk: planning a layoff in engineering team next month.");
      handleAsk();
    }
    else if (actionId === "generate_ppt") {
      // Export current preview or do custom insights slides
      setActiveNav("gaps"); // Moves to slides generate layout
    }
    else if (actionId === "view_tasks") {
      const element = document.getElementById("tasks-section");
      element?.scrollIntoView({ behavior: "smooth" });
    }
    else if (actionId === "recent_activities") {
      const element = document.getElementById("activities-section");
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTaskSuggestion = (actionText) => {
    setQuery(actionText);
    setTimeout(() => {
      handleAsk();
    }, 100);
  };

  const unreadNotifCount = notifications.filter(n => n.status === "unread").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Header Banner & Quick Actions */}
      <div style={{ ...cardStyle, marginTop: 0, padding: "1.5rem", background: `linear-gradient(135deg, ${themeColors.panelSurface} 0%, ${themeColors.bgBase} 100%)` }}>
        <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "0.25rem" }}>
          Welcome back Copilot,
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
          Your Autonomous Agent Grid and Workflow Center is active. Execute actions below.
        </p>

        {/* Quick Actions Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
          {[
            { id: "search_knowledge", label: "Search Knowledge", icon: Search },
            { id: "generate_email", label: "Generate Email", icon: Mail },
            { id: "generate_report", label: "Generate Report", icon: FileText },
            { id: "meeting_summary", label: "Meeting Summary", icon: Mic },
            { id: "upload_document", label: "Upload Document", icon: FolderOpen },
            { id: "start_workflow", label: "Start Workflow", icon: Zap },
            { id: "risk_analysis", label: "Risk Analysis", icon: AlertTriangle },
            { id: "generate_ppt", label: "Generate PPT", icon: Lightbulb },
            { id: "view_tasks", label: "View Tasks", icon: CheckSquare },
            { id: "recent_activities", label: "Activities", icon: Activity }
          ].map((act) => {
            const ActionIcon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => handleQuickAction(act.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  background: "rgba(201, 162, 39, 0.15)",
                  border: `1px solid ${themeColors.borderDivider}`,
                  color: themeColors.textPrimary,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  gap: "0.5rem"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = themeColors.highlightAmber;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = themeColors.borderDivider;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <ActionIcon size={24} style={{ color: themeColors.highlightAmber }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Dashboard Split Layout */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        
        {/* Left Side: Copilot Coprocessor Chat */}
        <div style={{ flex: "2 1 500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Chat Panel */}
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={sectionLabelStyle}>COGNITIVE COPROCESSOR</div>
              <span style={{ fontSize: "0.8rem", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily }}>
                Context: {selectedTeam}
              </span>
            </div>
            
            <form onSubmit={handleAsk}>
              <div style={{ position: "relative" }}>
                <textarea
                  id="chat-textarea"
                  placeholder="Ask Company Policies, draft reports, generate emails or check risk..."
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
                  Listening... speak your request now
                </p>
              )}
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? "Orchestrating Agents..." : "Execute Request"}
              </button>
            </form>

            {error && (
              <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginTop: "1rem" }}>
                {error}
              </div>
            )}

            {/* Answer Display */}
            {result && (
              <div style={{ marginTop: "1.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ ...pillStyle, color: themeColors.highlightAmber, background: "rgba(240,167,66,0.1)" }}>
                        {result.agent || "AI Copilot Response"}
                      </span>
                    </div>
                    <div style={{ color: themeColors.textPrimary, lineHeight: 1.6, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                      {result.answer}
                    </div>
                  </div>
                  
                  {result.confidence_score !== undefined && (
                    (() => {
                      const c = confidenceStyle(result.confidence_score);
                      return (
                        <div
                          style={{
                            flexShrink: 0,
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: themeColors.badgeViolet,
                            border: `2px solid ${c.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: c.color,
                            fontFamily: typography.mono.fontFamily,
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                          }}
                          title={`${c.label}: ${result.confidence_score}/100`}
                        >
                          {result.confidence_score}%
                        </div>
                      );
                    })()
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
                  <button onClick={() => setShowReasoning((v) => !v)} style={linkButtonStyle}>
                    {showReasoning ? "Hide" : "Show"} execution details
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
                {showReasoning && (
                  <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginTop: "0.75rem", fontStyle: "italic" }}>
                    {result.reasoning}
                  </p>
                )}

                {result.sources && result.sources.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4 style={sectionLabelStyle}>Sources</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {result.sources.map((s, i) => (
                        <span key={i} style={pillStyle}>📄 {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.experts && result.experts.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4 style={sectionLabelStyle}>People who may know more</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {result.experts.map((e, i) => {
                        const status = notifiedExperts[e];
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ ...pillStyle, color: themeColors.highlightAmber, background: "rgba(201, 162, 39, 0.1)", fontSize: "0.75rem" }}>👤 {e}</span>
                            {(!status || status.status === "error") && (
                              <button
                                type="button"
                                onClick={() => handleNotifyExpert(e)}
                                style={{
                                  background: "rgba(201, 162, 39, 0.15)",
                                  border: `1px solid ${themeColors.borderDivider}`,
                                  borderRadius: "4px",
                                  color: themeColors.textPrimary,
                                  fontSize: "0.7rem",
                                  padding: "0.2rem 0.4rem",
                                  cursor: "pointer",
                                }}
                              >
                                Notify {e}
                              </button>
                            )}
                            {status?.status === "success" && (
                              <span style={{ fontSize: "0.75rem", color: themeColors.confidenceHigh }}>✅ {status.message}</span>
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

          {/* AI Suggestions & Recommendations Engine */}
          {recommendations && (
            <div style={{ ...cardStyle, marginTop: 0 }}>
              <div style={sectionLabelStyle}>RECOMMENDATION ENGINE</div>
              <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.75rem" }}>
                Suggested Next Actions
              </h3>
              
              {/* Dynamic Task suggestion buttons */}
              {recommendations.actions && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                  {recommendations.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleTaskSuggestion(act)}
                      style={{
                        background: "rgba(201, 162, 39, 0.1)",
                        border: `1px solid ${themeColors.highlightAmber}44`,
                        color: themeColors.highlightAmber,
                        borderRadius: "8px",
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201, 162, 39, 0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(201, 162, 39, 0.1)"}
                    >
                      🚀 {act}
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions Categories */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.3rem" }}>Emails & Communications</div>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {recommendations.emails?.map((e, idx) => <li key={idx}><span onClick={() => { setActiveNav("emails"); }} style={{ color: themeColors.highlightAmber, cursor: "pointer", textDecoration: "underline" }}>{e}</span></li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.3rem" }}>Workflows & Approvals</div>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {recommendations.workflows?.map((w, idx) => <li key={idx}><span onClick={() => { setActiveNav("workflows"); }} style={{ color: themeColors.highlightAmber, cursor: "pointer", textDecoration: "underline" }}>{w}</span></li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.3rem" }}>Business Reports</div>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {recommendations.reports?.map((r, idx) => <li key={idx}><span onClick={() => { setActiveNav("reports"); }} style={{ color: themeColors.highlightAmber, cursor: "pointer", textDecoration: "underline" }}>{r}</span></li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.3rem" }}>Related Knowledge Files</div>
                  <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {recommendations.documents?.map((d, idx) => <li key={idx}>📄 {d}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Memory section */}
          {memory && (
            <div style={{ ...cardStyle, marginTop: 0 }}>
              <div style={sectionLabelStyle}>AI MEMORY CACHE</div>
              <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.75rem" }}>
                Recent Generated Assets
              </h3>
              <p style={{ color: themeColors.textSecondary, fontSize: "0.8rem", margin: "0 0 1rem 0" }}>Continue working on your recently processed emails, meetings, or compliance workflows.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.4rem" }}>Generated Emails</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {memory.recent_emails?.slice(0, 3).map((e) => (
                      <div key={e.id} onClick={() => setActiveNav("emails")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.4rem", borderRadius: "6px", cursor: "pointer" }}>
                        📧 {e.subject.slice(0, 20)}...
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.4rem" }}>Meeting Summaries</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {memory.recent_meetings?.slice(0, 3).map((m) => (
                      <div key={m.id} onClick={() => setActiveNav("meetings")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.4rem", borderRadius: "6px", cursor: "pointer" }}>
                        🎙️ {m.filename.slice(0, 20)}...
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.4rem" }}>Active Workflows</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {memory.recent_workflows?.slice(0, 3).map((w) => (
                      <div key={w.id} onClick={() => setActiveNav("workflows")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.4rem", borderRadius: "6px", cursor: "pointer" }}>
                        ⚡ {w.template_name} - {w.status}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Notification Center, Checklist Tasks, Activity Timeline */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Notification Center */}
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={sectionLabelStyle}>ALERTS</div>
              {unreadNotifCount > 0 && (
                <span style={{ ...pillStyle, color: themeColors.bgBase, background: themeColors.highlightAmber, fontWeight: "bold" }}>
                  {unreadNotifCount} New
                </span>
              )}
            </div>

            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.75rem" }}>
              Notification Center
            </h3>

            {notifications.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>No notifications yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                {notifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      background: notif.status === "unread" ? "rgba(201, 162, 39, 0.15)" : "#1A1A1A",
                      border: `1px solid ${notif.status === "unread" ? themeColors.highlightAmber : themeColors.borderDivider}`,
                      borderRadius: "8px",
                      padding: "0.6rem 0.8rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.5rem"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: themeColors.textPrimary }}>{notif.title}</div>
                      <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.2rem" }}>{notif.content}</div>
                    </div>
                    {notif.status === "unread" && (
                      <button
                        onClick={() => handleReadNotification(notif.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: themeColors.highlightAmber,
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}
                      >
                        Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checklist Tasks */}
          <div id="tasks-section" style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={sectionLabelStyle}>MY ACTION ITEMS</div>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: themeColors.highlightAmber,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {showTaskForm ? "✕" : "＋"}
              </button>
            </div>
            
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "0.75rem" }}>
              Task Checklist
            </h3>

            {showTaskForm && (
              <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", background: "#1A1A1A", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${themeColors.borderDivider}` }}>
                <input type="text" placeholder="Task title..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.6rem", fontSize: "0.85rem" }} required />
                <input type="text" placeholder="Description..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.6rem", fontSize: "0.85rem" }} />
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: "#1A1A1A", flex: 1 }}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} style={{ ...inputStyle, padding: "0.4rem 0.6rem", fontSize: "0.85rem", flex: 1 }} />
                </div>
                <button type="submit" style={{ ...buttonStyle, marginTop: "0.4rem", padding: "0.4rem" }}>Create Task</button>
              </form>
            )}

            {tasks.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>No pending tasks.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                {tasks.map((task) => {
                  const isDone = task.status === "completed";
                  return (
                    <div
                      key={task.id}
                      style={{
                        background: "#1A1A1A",
                        border: `1px solid ${isDone ? "rgba(52,211,153,0.2)" : themeColors.borderDivider}`,
                        borderRadius: "8px",
                        padding: "0.6rem 0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        opacity: isDone ? 0.6 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(task.id, task.status)}
                        style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: themeColors.highlightAmber }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: themeColors.textPrimary, textDecoration: isDone ? "line-through" : "none" }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>{task.description}</div>}
                        <div style={{ fontSize: "0.7rem", color: themeColors.highlightAmber, marginTop: "0.2rem" }}>
                          Due: {task.deadline || "No Deadline"} | Scope: {task.assigned_to}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div id="activities-section" style={{ ...cardStyle, marginTop: 0 }}>
            <div style={sectionLabelStyle}>HISTORY STREAM</div>
            <h3 style={{ ...typography.heading, fontSize: "1.2rem", marginTop: 0, marginBottom: "1rem" }}>
              Activity Timeline
            </h3>

            {activities.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>No activities logged.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "300px", overflowY: "auto", paddingLeft: "0.5rem" }}>
                {activities.slice(0, 10).map((act, i) => (
                  <div
                    key={act.id}
                    style={{
                      borderLeft: `2px solid ${themeColors.accentPrimary}`,
                      paddingLeft: "0.75rem",
                      position: "relative"
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-5px",
                        top: "2px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: themeColors.highlightAmber
                      }}
                    />
                    <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, fontFamily: typography.mono.fontFamily }}>
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: themeColors.textPrimary }}>
                      {act.description}
                    </div>
                    {act.details && (
                      <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontStyle: "italic" }}>
                        {act.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
