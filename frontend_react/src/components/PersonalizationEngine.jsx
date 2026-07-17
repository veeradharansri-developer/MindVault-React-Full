import { useState, useEffect } from "react";
import axios from "axios";
import { getOnboardingSuggestions, logOnboardingProgress, getOnboardingProgress, getDashboard, getTeams, createTeam } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";
import EmptyState from "./EmptyState";
import { GraduationCap, Users, Settings, User, Bot, Target, FileText, Zap, HelpCircle } from "lucide-react";

const ROLES = [
  "Software Engineer",
  "Sales Representative",
  "HR Specialist",
  "Product Manager",
  "General Employee"
];

const TONE_PREFS = [
  "Professional",
  "Casual",
  "Academic",
  "Empathetic",
  "Direct"
];

export default function PersonalizationEngine({ apiKey, selectedTeam, setSelectedTeam, setActiveNav, onTriggerQuery }) {
  const [subTab, setSubTab] = useState("profile"); // 'profile', 'recommendations', 'onboarding', 'memory'

  // --- 1. PROFILE & TEAMS STATES ---
  const [userRole, setUserRole] = useState(sessionStorage.getItem("userRole") || "General Employee");
  const [commStyle, setCommStyle] = useState(sessionStorage.getItem("commStyle") || "Professional");
  const [teams, setTeams] = useState(["General"]);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(false);

  // --- 2. RECOMMENDATIONS STATES ---
  const [recs, setRecs] = useState({
    recommended_documents: [],
    recommended_workflows: [],
    frequent_queries: [],
    recently_viewed_documents: []
  });
  const [recsLoading, setRecsLoading] = useState(false);

  // --- 3. ONBOARDING STATES ---
  const [onboardRole, setOnboardRole] = useState(ROLES[0]);
  const [onboardSuggestions, setOnboardSuggestions] = useState([]);
  const [completedOnboardItems, setCompletedOnboardItems] = useState([]);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  // --- 4. AI MEMORY STATES ---
  const [memory, setMemory] = useState(null);
  const [memoryLoading, setMemoryLoading] = useState(false);

  // Load Profile/Teams Data
  const loadTeams = async () => {
    setTeamsLoading(true);
    try {
      const data = await getTeams();
      setTeams(data.map(t => t.name || t));
    } catch (e) {
      console.error(e);
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setRecsLoading(true);
    try {
      const savedRole = sessionStorage.getItem("userRole") || "General Employee";
      const dept = savedRole.toLowerCase().includes("hr") ? "HR Operations" : 
                   (savedRole.toLowerCase().includes("engineer") || savedRole.toLowerCase().includes("developer") ? "Engineering" : "General");
      
      const res = await axios.get(`${API_BASE_URL}/api/personalization/recommendations`, {
        params: {
          role: savedRole,
          department: dept,
          team_id: selectedTeam
        }
      });
      setRecs(res.data);
    } catch (e) {
      console.error("Failed to load personalization data", e);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === "profile") {
      loadTeams();
    } else if (subTab === "recommendations") {
      loadRecommendations();
    }
  }, [subTab, selectedTeam]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    sessionStorage.setItem("userRole", userRole);
    sessionStorage.setItem("commStyle", commStyle);
    alert("✓ Personalization Profile updated!");
    loadRecommendations();
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await createTeam(newTeamName.trim());
      setNewTeamName("");
      loadTeams();
      alert("✓ Team created successfully!");
    } catch (err) {
      alert("Failed to create team: " + (err.response?.data?.detail || ""));
    }
  };

  // Onboarding Logic
  const loadOnboarding = async (role) => {
    setOnboardLoading(true);
    setOnboardError("");
    try {
      const data = await getOnboardingSuggestions(role, apiKey);
      setOnboardSuggestions(data);
      const progressData = await getOnboardingProgress(role);
      setCompletedOnboardItems(progressData.completed_items || []);
    } catch (err) {
      console.error(err);
      setOnboardError(err?.response?.data?.detail || "Failed to load onboarding suggestions.");
    } finally {
      setOnboardLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === "onboarding") {
      loadOnboarding(onboardRole);
    }
  }, [subTab, onboardRole, apiKey]);

  const handleMarkAsRead = async (filename) => {
    try {
      await logOnboardingProgress(onboardRole, filename);
      setCompletedOnboardItems(prev => [...prev, filename]);
    } catch (err) {
      alert("Failed to save reading progress.");
    }
  };

  // Memory Logic
  const loadMemory = async () => {
    setMemoryLoading(true);
    try {
      const data = await getDashboard();
      setMemory(data.memory || null);
    } catch (e) {
      console.error("Failed to load memory context", e);
    } finally {
      setMemoryLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === "memory") {
      loadMemory();
    }
  }, [subTab]);

  const percentComplete = onboardSuggestions.length > 0
    ? Math.round((completedOnboardItems.filter(item => onboardSuggestions.some(s => s.filename === item)).length / onboardSuggestions.length) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sub Tab Navigation */}
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
          { id: "profile", label: "👤 Profile & Teams", icon: User },
          { id: "recommendations", label: "🎯 Recommendations Dashboard", icon: Target },
          { id: "onboarding", label: "🎓 Onboarding Checklist", icon: GraduationCap },
          { id: "memory", label: "🧠 AI Memory Cache", icon: Bot }
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                background: subTab === tab.id ? "rgba(201, 162, 39, 0.12)" : "transparent",
                color: subTab === tab.id ? themeColors.textPrimary : themeColors.textSecondary,
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.2rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: typography.body.fontFamily,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- A. PROFILE & TEAMS TAB --- */}
      {subTab === "profile" && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
            <div style={sectionLabelStyle}>USER PERSONALIZATION</div>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem" }}>My Preferences Profile</h3>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary }}>My Corporate Role</label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary }}>Preferred AI Communication Tone</label>
                <select
                  value={commStyle}
                  onChange={(e) => setCommStyle(e.target.value)}
                  style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
                >
                  {TONE_PREFS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button type="submit" style={buttonStyle}>Save Profile Settings</button>
            </form>
          </div>

          <div style={{ ...cardStyle, flex: "1 1 350px", marginTop: 0 }}>
            <div style={sectionLabelStyle}>COGNITIVE CONTEXT</div>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>My Active Team Profile</h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
              Select a team context. RAG document retrieval filters answers to match this team.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary }}>Active Team Scope Selector</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A", fontWeight: "bold", color: themeColors.highlightAmber }}
                >
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary }}>Add New Corporate Team</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}
                  />
                  <button type="submit" style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}>Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- B. PERSONALIZED RECOMMENDATIONS DASHBOARD TAB --- */}
      {subTab === "recommendations" && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>AI ADVISORY SERVICES</div>
          <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "0.5rem" }}>
            Personalized Hub for {userRole}
          </h2>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Dynamically recommended files, actions, and frequent inquiries matching your active department profile.
          </p>

          {recsLoading ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Analysing role footprint and fetching resources...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {/* Rec 1: Documents */}
              <div style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <FileText size={18} style={{ color: themeColors.highlightAmber }} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: themeColors.textPrimary }}>Suggested Documents</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recs.recommended_documents?.map(doc => (
                    <div
                      key={doc}
                      onClick={() => {
                        if (onTriggerQuery) {
                          onTriggerQuery(`summarize the contents of document ${doc}`);
                        } else {
                          setActiveNav("chat");
                        }
                      }}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${themeColors.borderDivider}`,
                        fontSize: "0.85rem",
                        color: themeColors.textPrimary,
                        cursor: "pointer",
                        hover: { background: "rgba(255,255,255,0.05)" }
                      }}
                    >
                      📄 {doc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rec 2: Workflows */}
              <div style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <Zap size={18} style={{ color: themeColors.highlightAmber }} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: themeColors.textPrimary }}>Recommended Workflows</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recs.recommended_workflows?.map(wf => (
                    <button
                      key={wf}
                      onClick={() => setActiveNav("workflows")}
                      style={{
                        textAlign: "left",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${themeColors.borderDivider}`,
                        fontSize: "0.85rem",
                        color: themeColors.textPrimary,
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      ⚡ Start {wf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rec 3: Queries */}
              <div style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <HelpCircle size={18} style={{ color: themeColors.highlightAmber }} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: themeColors.textPrimary }}>Frequent Query Prompts</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recs.frequent_queries?.map(query => (
                    <button
                      key={query}
                      onClick={() => {
                        if (onTriggerQuery) {
                          onTriggerQuery(query);
                        } else {
                          setActiveNav("chat");
                        }
                      }}
                      style={{
                        textAlign: "left",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        background: "rgba(201, 162, 39, 0.05)",
                        border: `1px solid rgba(201,162,39,0.2)`,
                        fontSize: "0.85rem",
                        color: themeColors.highlightAmber,
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      🔍 &ldquo;{query}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- C. ONBOARDING CHECKLIST TAB --- */}
      {subTab === "onboarding" && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>ROLE-BASED INTEL</div>
          <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
            Role-Based Onboarding Explorer
          </h2>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            MindVault recommends relevant compliance and training docs matching this profile.
          </p>

          <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "300px" }}>
            <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary }}>Select Onboarding Profile</label>
            <select
              value={onboardRole}
              onChange={(e) => setOnboardRole(e.target.value)}
              style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {onboardError && (
            <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1rem" }}>
              {onboardError}
            </div>
          )}

          {onboardLoading ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Retrieving semantic training plans...</p>
          ) : onboardSuggestions.length === 0 ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>No specific onboarding files mapped for this role yet.</p>
          ) : (
            <div>
              {/* Progress */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", color: themeColors.textSecondary }}>Reading Progress:</span>
                  <span style={{ fontSize: "0.9rem", color: themeColors.highlightAmber, fontWeight: "bold" }}>
                    {percentComplete}% Complete
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${percentComplete}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${themeColors.accentPrimary} 0%, ${themeColors.highlightAmber} 100%)`,
                      borderRadius: "4px",
                      transition: "width 0.4s ease-out"
                    }}
                  />
                </div>
              </div>

              {/* Suggestions checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {onboardSuggestions.map((sug) => {
                  const isRead = completedOnboardItems.includes(sug.filename);
                  return (
                    <div
                      key={sug.filename}
                      style={{
                        background: "#1A1A1A",
                        border: `1px solid ${isRead ? "rgba(52, 211, 153, 0.25)" : themeColors.borderDivider}`,
                        borderRadius: "10px",
                        padding: "1.25rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1.5rem"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: "1rem" }}>📄 {sug.filename}</span>
                          {isRead && (
                            <span style={{ background: "rgba(52, 211, 153, 0.15)", color: themeColors.confidenceHigh, fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p style={{ color: themeColors.textPrimary, fontSize: "0.9rem", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>
                          <strong style={{ color: themeColors.highlightAmber }}>Relevance:</strong> {sug.reason}
                        </p>
                        {sug.key_takeaway && (
                          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: 0, fontStyle: "italic" }}>
                            Takeaway: {sug.key_takeaway}
                          </p>
                        )}
                      </div>

                      <button
                        disabled={isRead}
                        onClick={() => handleMarkAsRead(sug.filename)}
                        style={{
                          flexShrink: 0,
                          background: isRead ? "rgba(255, 255, 255, 0.03)" : "rgba(201, 162, 39, 0.25)",
                          border: `1px solid ${isRead ? themeColors.borderDivider : "rgba(201, 162, 39, 0.5)"}`,
                          color: isRead ? themeColors.textSecondary : themeColors.textPrimary,
                          padding: "0.4rem 0.8rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          cursor: isRead ? "default" : "pointer",
                          fontWeight: 600
                        }}
                      >
                        {isRead ? "✓ Read" : "Mark as read"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- D. AI MEMORY TAB --- */}
      {subTab === "memory" && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>INTERNALIZED CONTEXT</div>
          <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
            AI Memory Cache Log
          </h2>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Expose internal conversational memory contexts and generated workspace assets.
          </p>

          {memoryLoading && !memory ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Recalling session interactions...</p>
          ) : !memory ? (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>No memory profiles initialized.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {/* Emails */}
              <div>
                <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.5rem" }}>Recent Emails</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {memory.recent_emails?.length === 0 ? <p style={{ fontSize: "0.8rem", color: themeColors.textSecondary, fontStyle: "italic" }}>None generated</p> :
                    memory.recent_emails?.slice(0, 5).map((e) => (
                      <div key={e.id} onClick={() => setActiveNav("doc_gen")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.5rem", borderRadius: "6px", cursor: "pointer" }}>
                        e.subject
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Meetings */}
              <div>
                <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.5rem" }}>Meetings Summarized</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {memory.recent_meetings?.length === 0 ? <p style={{ fontSize: "0.8rem", color: themeColors.textSecondary, fontStyle: "italic" }}>None summarized</p> :
                    memory.recent_meetings?.slice(0, 5).map((m) => (
                      <div key={m.id} onClick={() => setActiveNav("chat")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.5rem", borderRadius: "6px", cursor: "pointer" }}>
                        🎙️ {m.filename.slice(0, 30)}...
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Workflows */}
              <div>
                <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "bold", marginBottom: "0.5rem" }}>Active Workflows</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {memory.recent_workflows?.length === 0 ? <p style={{ fontSize: "0.8rem", color: themeColors.textSecondary, fontStyle: "italic" }}>None running</p> :
                    memory.recent_workflows?.slice(0, 5).map((w) => (
                      <div key={w.id} onClick={() => setActiveNav("workflows")} style={{ fontSize: "0.8rem", background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, padding: "0.5rem", borderRadius: "6px", cursor: "pointer" }}>
                        ⚡ {w.template_name} - <span style={{ color: w.status === "completed" || w.status === "approved" ? themeColors.confidenceHigh : themeColors.highlightAmber }}>{w.status}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
