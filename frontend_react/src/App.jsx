import { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

// Dynamic Dashboard Pages
import Workspace from "./components/Workspace";
import KnowledgePage from "./components/KnowledgePage";
import WorkflowsPage from "./components/WorkflowsPage";
import DocumentsPage from "./components/DocumentsPage";
import HistoryPage from "./components/HistoryPage";
import SettingsPage from "./components/SettingsPage";
import Login from "./components/Login";
import InternshipRecruitment from "./components/InternshipRecruitment";
import LeaveManagement from "./components/LeaveManagement";

import { 
  Sparkles, Database, Zap, FolderOpen, Clock, Settings, Bot, LogOut,
  FileText, CheckSquare, ClipboardList, BookOpen, DatabaseBackup
} from "lucide-react";
import { themeColors, typography, radius, pillStyle } from "./styles";

// nav item configurations mapped specifically to the user's role
const ROLE_NAV_CONFIGS = {
  HR: [
    { id: "hr_offer", label: "Generate Offer Letter", component: "workspace", icon: FileText, defaultQuery: "Generate Offer Letter for Rahul Sharma" },
    { id: "hr_recruitment", label: "Internship Recruitment", component: "recruitment", icon: ClipboardList },
    { id: "hr_onboard", label: "Employee Onboarding", component: "workflows", icon: Zap },
    { id: "hr_leave", label: "Leave Approval", component: "leave", icon: CheckSquare },
    { id: "hr_reports", label: "HR Reports", component: "documents", icon: ClipboardList, defaultCategory: "Reports" },
    { id: "hr_policies", label: "Company Policies", component: "knowledge", icon: BookOpen },
    { id: "hr_records", label: "Employee Records", component: "history", icon: Clock },
  ],
  Employee: [
    { id: "emp_assistant", label: "AI Assistant", component: "workspace", icon: Sparkles },
    { id: "emp_search", label: "Search Company Knowledge", component: "knowledge", icon: Database },
    { id: "emp_docs", label: "My Documents", component: "documents", icon: FolderOpen },
    { id: "emp_leave", label: "Apply Leave", component: "leave", icon: Zap },
    { id: "emp_meetings", label: "Meeting Summaries", component: "documents", icon: FileText, defaultCategory: "Meeting Minutes" },
    { id: "emp_policies", label: "Company Policies", component: "knowledge", icon: BookOpen },
  ],
  Manager: [
    { id: "mgr_recruitment", label: "Internship Recruitment", component: "recruitment", icon: ClipboardList },
    { id: "mgr_pending", label: "Leave Approvals", component: "leave", icon: CheckSquare },
    { id: "mgr_reports", label: "Team Reports", component: "documents", icon: FolderOpen, defaultCategory: "Reports" },
    { id: "mgr_workflows", label: "Team Workflows", component: "workflows", icon: Zap },
    { id: "mgr_perf", label: "Performance Reports", component: "documents", icon: ClipboardList, defaultCategory: "Reports" },
    { id: "mgr_assistant", label: "AI Assistant", component: "workspace", icon: Sparkles },
  ]
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("userToken") === "mindvault-session-token-xyz"
  );

  const [activeNav, setActiveNav] = useState("workspace");
  const [apiKey, setApiKey] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("General");
  const [userRole, setUserRole] = useState("Software Engineer");

  const currentUserRole = sessionStorage.getItem("userRole") || "Employee";
  const allowedNavs = ROLE_NAV_CONFIGS[currentUserRole] || ROLE_NAV_CONFIGS.Employee;

  // Protect and normalize routing based on active dynamic nav configuration
  useEffect(() => {
    if (isAuthenticated) {
      const isValid = allowedNavs.some((item) => item.id === activeNav);
      if (!isValid) {
        setActiveNav(allowedNavs[0].id);
      }
    }
  }, [isAuthenticated, currentUserRole, activeNav, allowedNavs]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Active navigation config object
  const activeItem = allowedNavs.find((item) => item.id === activeNav) || allowedNavs[0];

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: themeColors.bgBase,
        color: themeColors.textPrimary,
        fontFamily: typography.body.fontFamily,
        display: "flex",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Left Sidebar Rail (240px) - Rendered dynamically based on permissions */}
      <div
        style={{
          width: "240px",
          backgroundColor: themeColors.panelSurface,
          borderRight: `1px solid ${themeColors.borderDivider}`,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0.75rem",
          gap: "0.5rem",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          boxShadow: "2px 0 10px rgba(0,0,0,0.01)",
          overflowY: "auto",
        }}
      >
        {/* Brand logo */}
        <div
          style={{
            fontFamily: typography.heading.fontFamily,
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: themeColors.textPrimary,
            marginBottom: "2rem",
            padding: "0 0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Bot size={24} style={{ color: themeColors.accentPrimary }} />
          <span>MindVault AI</span>
        </div>

        {/* Dynamic Sidebar navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {allowedNavs.map((item) => {
            const isActive = activeNav === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: radius.md,
                  background: isActive ? "rgba(201, 162, 39, 0.08)" : "transparent",
                  border: "none",
                  color: isActive ? themeColors.accentPrimary : themeColors.textSecondary,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: typography.body.fontFamily,
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                <IconComponent size={16} style={{ color: isActive ? themeColors.accentPrimary : themeColors.textSecondary }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ready indicator footer */}
        <div style={{ marginTop: "auto", padding: "0.75rem", borderTop: `1px solid ${themeColors.borderDivider}`, fontSize: "0.75rem", color: themeColors.textSecondary }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: themeColors.accentPrimary }} />
            <span>Ready for queries</span>
          </div>
          <div style={{ marginTop: "0.25rem", fontSize: "0.7rem", opacity: 0.8 }}>
            Team: {selectedTeam}
          </div>
        </div>
      </div>

      {/* 2. Main content area containing Protected Layout Route & Top Navbar */}
      <div
        style={{
          marginLeft: "240px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top Navbar display */}
        <div style={{
          height: "70px",
          backgroundColor: themeColors.panelSurface,
          borderBottom: `1px solid ${themeColors.borderDivider}`,
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 999,
        }}>
          {/* Header title */}
          <h3 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
            {activeItem?.label || "Workspace"}
          </h3>

          {/* User profile detail block */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "50%",
                background: "rgba(201, 162, 39, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                border: `1px solid ${themeColors.borderDivider}`
              }}>
                {sessionStorage.getItem("userAvatar") || "👤"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: themeColors.textPrimary }}>
                  {sessionStorage.getItem("userName") || "User"}
                </span>
                <span style={{ fontSize: "0.72rem", color: themeColors.textSecondary }}>
                  {sessionStorage.getItem("userDept") || "Department"}
                </span>
              </div>
            </div>

            {/* Department Role Badge */}
            <span style={{
              ...pillStyle,
              fontSize: "0.72rem",
              padding: "0.15rem 0.5rem",
              color: themeColors.accentPrimary,
              borderColor: "transparent",
              background: "rgba(201, 162, 39, 0.08)",
              fontWeight: "600"
            }}>
              {sessionStorage.getItem("userBadge") || "Role"}
            </span>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: themeColors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                transition: "color 0.2s",
                padding: "0.4rem 0.6rem",
                borderRadius: "8px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = themeColors.danger}
              onMouseOut={(e) => e.currentTarget.style.color = themeColors.textSecondary}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content viewport with Protected component routing */}
        <div style={{ padding: "2.5rem 2rem", boxSizing: "border-box", minWidth: 0 }}>
          <ErrorBoundary>
            {activeItem.component === "workspace" && (
              <Workspace 
                apiKey={apiKey} 
                selectedTeam={selectedTeam} 
                defaultQuery={activeItem.defaultQuery} 
                role={currentUserRole}
              />
            )}
            
            {activeItem.component === "knowledge" && (
              <KnowledgePage apiKey={apiKey} />
            )}
            
            {activeItem.component === "workflows" && (
              <WorkflowsPage workflowType={activeItem.id} />
            )}
            
            {activeItem.component === "documents" && (
              <DocumentsPage defaultCategory={activeItem.defaultCategory} />
            )}
            
            {activeItem.component === "history" && (
              <HistoryPage />
            )}
            
            {activeItem.component === "settings" && (
              <SettingsPage
                apiKey={apiKey}
                setApiKey={setApiKey}
                selectedTeam={selectedTeam}
                setSelectedTeam={setSelectedTeam}
                userRole={userRole}
                setUserRole={setUserRole}
              />
            )}

            {activeItem.component === "recruitment" && (
              <InternshipRecruitment role={currentUserRole} />
            )}

            {activeItem.component === "leave" && (
              <LeaveManagement role={currentUserRole} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
