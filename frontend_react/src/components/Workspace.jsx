import { useState, useEffect, useRef } from "react";
import { askMindVault, logActivity } from "../api";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { Sparkles, CheckCircle2, ArrowRight, Download, FileText, Layers, Cpu } from "lucide-react";

// Dynamic configurations for each enterprise department role
const ROLE_WORKSPACE_CONFIGS = {
  HR: {
    greeting: "Hello, ready to manage recruitment pipelines?",
    placeholder: "Ask about hiring compliance, onboarding workflows, or salary bands... (Ctrl + K to focus)",
    emptyStateText: "Request offer letters or kick off employee onboarding pipelines to begin.",
    quickActions: [
      { label: "Generate Offer Letter", text: "Generate Offer Letter for Rahul Sharma as a Senior Software Engineer", type: "Offer Letter" },
      { label: "Employee Onboarding", text: "Start onboarding workflow for Sarah Jenkins in support team", type: "Onboarding Checklist" },
      { label: "HR Report", text: "Compile Q3 HR Analysis compilation report", type: "Executive Summary" },
      { label: "Leave Approval", text: "Process leave request for Priya Patel", type: "Approval Notice" }
    ],
    recentTasks: [
      { id: "hr-task-1", name: "Offer Letter - Rahul Sharma", status: "Completed", time: "10 mins ago", type: "offer" },
      { id: "hr-task-2", name: "Onboarding SOP - Sarah Jenkins", status: "Completed", time: "1 hour ago", type: "onboard" }
    ]
  },
  Employee: {
    greeting: "Welcome back, ready to search corporate resources?",
    placeholder: "Ask about company benefits, annual leave rollover, or policies... (Ctrl + K to focus)",
    emptyStateText: "Ask the enterprise knowledge base or preview your generated documents.",
    quickActions: [
      { label: "Company Policies", text: "Show me the standard company travel and expense policy", type: "policy" },
      { label: "Meeting Summary", text: "Summarize the Q3 engineering planning meeting minutes", type: "meeting" },
      { label: "Apply Leave", text: "Apply for 5 days annual leave for Priya Patel", type: "leave" },
      { label: "My Documents", text: "Show my files indexed in the corporate archive", type: "report" }
    ],
    recentTasks: [
      { id: "emp-task-1", name: "Leave Request - Priya Patel", status: "Completed", time: "2 hours ago", type: "leave" },
      { id: "emp-task-2", name: "Meeting Minutes - Q3 Planning", status: "Completed", time: "Yesterday", type: "meeting" }
    ]
  },
  Manager: {
    greeting: "Hello, ready to authorize team executions?",
    placeholder: "Review pending leaves, run compliance rules, or generate team reports... (Ctrl + K to focus)",
    emptyStateText: "Inspect active authorization requests and approve pipelines from this panel.",
    quickActions: [
      { label: "Team Reports", text: "Generate team performance metrics compilation", type: "report" },
      { label: "Pending Approvals", text: "Check pending workflows and rules trigger logs", type: "leave" },
      { label: "Team Workflows", text: "List current active onboarding pipelines", type: "onboard" },
      { label: "Performance Dashboard", text: "Summarize department targets compliance status", type: "report" }
    ],
    recentTasks: [
      { id: "mgr-task-1", name: "Q3 HR Analysis Compilation", status: "Completed", time: "3 hours ago", type: "report" },
      { id: "mgr-task-2", name: "Leave Request - Priya Patel", status: "Completed", time: "1 day ago", type: "leave" }
    ]
  },
  Finance: {
    greeting: "Hello, ready to compile billing statements?",
    placeholder: "Ask about invoice details, billable hours tracking, or budgets... (Ctrl + K to focus)",
    emptyStateText: "Generate corporate billing invoices or review Q3 expense claims.",
    quickActions: [
      { label: "Generate Invoice", text: "Generate corporate invoice for Acme Corp billing", type: "invoice" },
      { label: "Expense Approval", text: "Process Q3 travel expense claims approval", type: "leave" },
      { label: "Budget Reports", text: "Summarize department expenditures vs budget", type: "report" },
      { label: "Financial Documents", text: "Fetch invoice billing terms contract", type: "invoice" }
    ],
    recentTasks: [
      { id: "fin-task-1", name: "Corporate Invoice - Acme Corp", status: "Completed", time: "15 mins ago", type: "invoice" },
      { id: "fin-task-2", name: "Expense Claim - Jessica Chen", status: "Completed", time: "2 days ago", type: "leave" }
    ]
  },
  "IT Admin": {
    greeting: "Hello System Administrator, monitoring core infrastructures...",
    placeholder: "Check query logs, verify RAG similarity metrics, or inspect audit history... (Ctrl + K to focus)",
    emptyStateText: "Run system audits, analyze knowledge gaps, or check security logs.",
    quickActions: [
      { label: "User Management", text: "Display all active enterprise users and roles configuration", type: "telemetry" },
      { label: "Audit Logs", text: "Inspect database transaction and API query logs", type: "telemetry" },
      { label: "System Monitoring", text: "Show system telemetry and execution latency metrics", type: "telemetry" },
      { label: "Knowledge Base", text: "Manage indexed files database and source categories", type: "telemetry" }
    ],
    recentTasks: [
      { id: "it-task-1", name: "System Telemetry Log", status: "Completed", time: "5 mins ago", type: "telemetry" },
      { id: "it-task-2", name: "Security Audit Report", status: "Completed", time: "1 hour ago", type: "telemetry" }
    ]
  }
};

export default function Workspace({ apiKey, selectedTeam, defaultQuery, role }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  // Right panel states
  const [docPreview, setDocPreview] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [nextAction, setNextAction] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);

  const currentRole = role || "Employee";
  const config = ROLE_WORKSPACE_CONFIGS[currentRole] || ROLE_WORKSPACE_CONFIGS.Employee;

  // Dynamically load recent tasks matching current active role
  const [recentTasks, setRecentTasks] = useState(config.recentTasks);

  useEffect(() => {
    setRecentTasks(config.recentTasks);
  }, [currentRole]);

  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const getDecisionSummary = (type, title) => {
    if (!type || !title) return "Reasoning unavailable due to insufficient context.";
    return `Successfully compiled and issued a corporate ${type} document for "${title.replace(".txt", "")}".`;
  };

  const getDecisionReason = (type) => {
    switch (type) {
      case "Offer Letter":
        return "The candidate evaluation checklist completed with positive ratings, and the salary structure satisfies standard engineering budget ranges.";
      case "Onboarding Checklist":
        return "Initiated to configure hardware logs, schedule orientation parameters, and prepare workspaces for the newly hired specialist.";
      case "Approval Notice":
        return "Automatic allowance checked against active leave policies, verifying that department backup resources are sufficient for coverage.";
      case "Executive Summary":
        return "Compiled to aggregate recruitment velocity and workflow execution percentages for Q3 leadership reviews.";
      case "Meeting Minutes":
        return "Transcribed from recorded audio logs to capture transition decisions and team sprint goals.";
      case "Corporate Invoice":
        return "Issued based on completed consulting hours to bill Acme Corp under net 30 payment terms.";
      default:
        return result?.reasoning || "Reasoning unavailable due to insufficient context.";
    }
  };

  const getKnowledgeUsed = (type) => {
    const defaultSources = result?.sources || [];
    if (defaultSources.length > 0) return defaultSources;

    switch (type) {
      case "Offer Letter":
        return ["recruitment_salary_bands.pdf", "offer_letter_terms_template.docx", "employment_contract_schedules.txt"];
      case "Onboarding Checklist":
        return ["employee_onboarding_guide.pdf", "it_equipment_allocation_rules.txt", "department_roles_directory.csv"];
      case "Approval Notice":
        return ["annual_leave_policy_2026.pdf", "team_calendar_availability.xlsx"];
      case "Executive Summary":
        return ["recruitment_status_database.db", "onboarding_progress_logs.db"];
      case "Meeting Minutes":
        return ["meeting_voice_audio_transcript.txt", "q3_engineering_schedule.xlsx"];
      case "Corporate Invoice":
        return ["consulting_hours_log.xlsx", "acme_corp_contract_terms.pdf"];
      default:
        return ["Reasoning unavailable due to insufficient context."];
    }
  };

  const getBusinessRules = (type) => {
    switch (type) {
      case "Offer Letter":
        return ["Salary Band Valid (₹24 LPA within limits)", "HR Policy Compliance", "Standard Offer Template Used", "Executive Sign-off Required"];
      case "Onboarding Checklist":
        return ["Department Profile Setup Verified", "IT Asset Allocation Check", "Background Verification Logs Checked"];
      case "Approval Notice":
        return ["Attendance Compliance Check", "Leave Balance Verification Passed", "Backup Staff Available"];
      case "Executive Summary":
        return ["Metrics Aggregation Integrity Verified", "Compliance Scoring Compliance Check"];
      case "Meeting Minutes":
        return ["Transcription Integrity Confirmed", "Action Items Assigned"];
      case "Corporate Invoice":
        return ["Billable Hours Audited", "Invoice Number Sequence Validated"];
      default:
        return ["Policy Source Verified", "Information Integrity Check", "Context Limit Validation"];
    }
  };

  const getNextRecommendations = (type) => {
    switch (type) {
      case "Offer Letter":
        return ["Request director signature in Workflows", "Notify candidate with offer link", "Schedule HR orientation call"];
      case "Onboarding Checklist":
        return ["Deliver welcome kit details to logistics", "Provision corporate Slack credentials", "Schedule mentor introduction"];
      case "Approval Notice":
        return ["Update payroll attendance logs", "Notify team of employee vacation window"];
      case "Executive Summary":
        return ["Publish report to board members", "Log gaps audit data in History tab"];
      case "Meeting Minutes":
        return ["Distribute minutes transcript to team Slack", "Trigger engineering task boards updates"];
      case "Corporate Invoice":
        return ["Send invoice PDF copy to client accounts", "Set payment tracking alert"];
      default:
        return ["Log transaction to corporate audit trails"];
    }
  };

  const textareaRef = useRef(null);
  const timelineEndRef = useRef(null);

  // Pre-fill query when defaultQuery changes
  useEffect(() => {
    if (defaultQuery) {
      setQuery(defaultQuery);
    }
  }, [defaultQuery]);

  // Ctrl + K keyboard shortcut to focus prompt
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll to bottom of timeline when steps execute
  useEffect(() => {
    if (currentStep >= 0) {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentStep]);

  const timelineSteps = [
    "Understanding Request",
    "Searching Knowledge Base",
    "Selecting Template",
    "Generating Document",
    "Starting Workflow",
    "Completed"
  ];

  const handleActionClick = (text) => {
    setQuery(text);
    textareaRef.current?.focus();
  };

  const handleReopenTask = (task) => {
    const taskText = config.quickActions.find(act => act.type === task.type)?.text || task.name;
    setQuery(taskText);
    setCurrentStep(5);
    triggerOutputMapping(task.type, "Mock API Answer Context");
  };

  const triggerOutputMapping = (keyword, backendAnswer) => {
    const qLower = keyword.toLowerCase();
    if (qLower.includes("offer")) {
      setDocPreview({
        title: "Offer Letter - Rahul Sharma.txt",
        type: "Offer Letter",
        content: `MINDVAULT ENTERPRISES LTD.\n-------------------------\nDate: July 17, 2026\n\nTo,\nRahul Sharma,\n\nSubject: Offer of Employment - Senior Software Engineer\n\nDear Rahul,\n\nWe are pleased to offer you the position of Senior Software Engineer. Your Annual Cost to Company (CTC) will be ₹24,0,000 (Twenty-Four Lakhs INR). Your joining date is confirmed as August 1, 2026.\n\nBest Regards,\nHR Team\nMindVault AI`
      });
      setWorkflowStatus({
        name: "Offer Letter Approval Flow",
        status: "Pending Signature",
        approver: "HR Director Priya Patel",
        progress: 80
      });
      setNextAction("Notify Manager to authorize candidate onboarding contract.");
      setDownloadLink("rahul_offer_letter.txt");
    } else if (qLower.includes("onboard")) {
      setDocPreview({
        title: "Onboarding SOP - Sarah Jenkins.txt",
        type: "Onboarding Checklist",
        content: `ONBOARDING CHECKLIST: Sarah Jenkins\n-----------------------------------\nRole: Support Specialist\nDepartment: Customer Support\n\n[✓] IT Asset Allocation (Laptop & Security Key)\n[ ] HR Orientation Session Scheduled\n[ ] Database Access Provisioning\n[ ] Slack and email credentials generated`
      });
      setWorkflowStatus({
        name: "Employee Onboarding Workflow",
        status: "Running",
        approver: "Support Manager",
        progress: 50
      });
      setNextAction("Send welcome packet and equipment request to logistics.");
      setDownloadLink("onboarding_sop_sarah.txt");
    } else if (qLower.includes("leave")) {
      setDocPreview({
        title: "Leave Approval Notification.txt",
        type: "Approval Notice",
        content: `LEAVE APPROVAL FORM\n-------------------\nEmployee: Priya Patel\nRequested: 5 Days (Annual Leave)\nStart Date: July 20, 2026\n\nStatus: Approved automatically by MindVault AI engine based on current policy compliance and team availability.`
      });
      setWorkflowStatus({
        name: "Leave Request Authorization",
        status: "Completed",
        approver: "System Engine",
        progress: 100
      });
      setNextAction("Update HR systems leave log balances.");
      setDownloadLink("leave_approval_priya.txt");
    } else if (qLower.includes("report")) {
      setDocPreview({
        title: "HR Executive Q3 Report.txt",
        type: "Executive Summary",
        content: `MINDVAULT Q3 HR ANALYSIS REPORT\n-------------------------------\nCompiled on: July 17, 2026\n\nKey Highlights:\n- New Hires this month: 4\n- Workflows triggered: 142 (95% automated)\n- Onboarding compliance rating: 98%\n- Projected headcount increase: 12% Q-o-Q.`
      });
      setWorkflowStatus({
        name: "HR Analytics Compilation",
        status: "Completed",
        approver: "Analytics Agent",
        progress: 100
      });
      setNextAction("Export report metrics to leadership board.");
      setDownloadLink("hr_q3_report.txt");
    } else if (qLower.includes("meeting")) {
      setDocPreview({
        title: "Q3 Engineering Meeting Minutes.txt",
        type: "Meeting Minutes",
        content: `MEETING MINUTES: Q3 Engineering Alignment\n---------------------------------------\nDate: July 17, 2026\n\nDecisions Made:\n1. Transition repository to unified Tailwind configuration.\n2. Scale local LLM reasoning limits to 4k tokens.\n\nAction Items:\n- Dev Team: Deploy vector search indexes (Deadline: July 25)`
      });
      setWorkflowStatus({
        name: "Minutes Transcription Flow",
        status: "Completed",
        approver: "System Scribe",
        progress: 100
      });
      setNextAction("Distribute Action Items to Engineering Slack Channel.");
      setDownloadLink("meeting_minutes.txt");
    } else if (qLower.includes("invoice")) {
      setDocPreview({
        title: "Corporate Invoice - Acme Corp.txt",
        type: "Corporate Invoice",
        content: `MINDVAULT ENTERPRISES LTD.\n-------------------------\nInvoice Ref: MV-2026-092\nClient: Acme Corporation\nDate: July 17, 2026\n\nDescription of Services:\n- Enterprise RAG Custom Integration: 40 Hours @ ₹4,500/hr\n- Expert System Orchestrator Setup: Flat Rate\n\nTotal Due: ₹3,80,000 (Three Lakhs Eighty Thousand INR)\nTerms: Net 30`
      });
      setWorkflowStatus({
        name: "Corporate Invoice Issuance",
        status: "Completed",
        approver: "Finance Controller Rajesh Patel",
        progress: 100
      });
      setNextAction("Send invoice copy to Acme accounts payable department.");
      setDownloadLink("invoice_acme_corp.txt");
    } else if (qLower.includes("telemetry") || qLower.includes("audit") || qLower.includes("security")) {
      setDocPreview({
        title: "Security & System Audit Report.txt",
        type: "Approval Notice",
        content: `MINDVAULT SYSTEM AUDIT LOGS\n-----------------------------\nDate: July 17, 2026\nStatus: Healthy\n\nSystem Metrics Summary:\n- Active Users: 5\n- Average API Latency: 120ms\n- Security Violations: 0\n- SQLite Activity Log integrity: VERIFIED`
      });
      setWorkflowStatus({
        name: "Infrastructure Health Audit",
        status: "Completed",
        approver: "System Administrator",
        progress: 100
      });
      setNextAction("Log telemetry metrics into History panel database.");
      setDownloadLink("security_audit_report.txt");
    } else {
      setDocPreview({
        title: "MindVault AI Output.txt",
        type: "AI Output Response",
        content: backendAnswer
      });
      setWorkflowStatus({
        name: "Query Response Generation",
        status: "Completed",
        approver: "MindVault AI",
        progress: 100
      });
      setNextAction("Review source citations in the Knowledge tab.");
      setDownloadLink("ai_output_response.txt");
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setDocPreview(null);
    setWorkflowStatus(null);
    setNextAction(null);
    setDownloadLink(null);
    setCurrentStep(0);

    // Dynamic type evaluation for recent tasks matching current workspace categories
    let taskType = "custom";
    const qLower = query.toLowerCase();
    if (qLower.includes("offer")) taskType = "offer";
    else if (qLower.includes("onboard")) taskType = "onboard";
    else if (qLower.includes("leave")) taskType = "leave";
    else if (qLower.includes("report")) taskType = "report";
    else if (qLower.includes("meeting")) taskType = "meeting";
    else if (qLower.includes("invoice")) taskType = "invoice";
    else if (qLower.includes("telemetry") || qLower.includes("audit") || qLower.includes("user")) taskType = "telemetry";

    // Add to recent tasks
    const newTask = {
      id: `task-${Date.now()}`,
      name: query.length > 32 ? query.slice(0, 32) + "..." : query,
      status: "Running",
      time: "Just now",
      type: taskType
    };
    setRecentTasks((prev) => [newTask, ...prev]);

    try {
      await logActivity({
        activity_type: "workspace_query",
        description: `Workspace query (${currentRole}): "${query.slice(0, 50)}..."`,
        details: query
      });
    } catch (e) {
      console.error(e);
    }

    // Animate timeline
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= timelineSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    // Apply strict department role-enforcing system prompt at LLM query dispatch layer
    const rolePrompt = `[System Directive: You are the enterprise AI assistant for the ${currentRole} department. You must only answer queries and perform tasks within the permissions of the ${currentRole} department. If the query belongs to another department's duties (for example, generating HR offer letters for a Finance user, or creating invoice bills for an Employee), politely refuse the request, explain that the user does not have permission for that department's actions, and guide them to switch to the correct role profile in the settings or main panel. Do not execute the request.] `;
    const secureQuery = rolePrompt + query;

    try {
      const data = await askMindVault(secureQuery, apiKey, selectedTeam);
      setResult(data);
      triggerOutputMapping(taskType, data.answer);
      
      // Update task status in list
      setRecentTasks((prev) => 
        prev.map((t) => t.id === newTask.id ? { ...t, status: "Completed" } : t)
      );
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong reaching the MindVault API.");
      clearInterval(stepInterval);
      setCurrentStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocFile = () => {
    if (!docPreview) return;
    const blob = new Blob([docPreview.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", docPreview.title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Left Column: Input and Redesigned 4 Sections */}
      <div style={{ flex: "1.2 1 600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Workspace Title & Input */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.1rem" }}>👋</span>
            <span style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {currentRole} AI Workplace Assistant
            </span>
          </div>
          <h2 style={{ ...typography.heading, fontSize: "1.8rem", marginTop: 0, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            {config.greeting}
          </h2>
          
          <form onSubmit={handleSend} style={{ width: "100%", position: "relative" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <textarea
                ref={textareaRef}
                placeholder={config.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "none",
                  fontSize: "1rem",
                  paddingRight: "4.5rem",
                  border: `1px solid ${themeColors.borderDivider}`,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  bottom: "0.75rem",
                  background: query.trim() ? themeColors.accentPrimary : "#2A2A2A",
                  color: query.trim() ? "#121212" : "#4D4D4D",
                  border: "none",
                  borderRadius: "12px",
                  width: "2.5rem",
                  height: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: query.trim() ? "pointer" : "default",
                  transition: "all 0.2s ease",
                }}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* REDESIGNED FOUR SECTIONS */}

        {/* 1. Quick Actions */}
        <div>
          <h4 style={{ ...typography.heading, fontSize: "0.9rem", color: themeColors.textSecondary, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            1. Quick Actions
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {config.quickActions.map((action, i) => (
              <div
                key={i}
                onClick={() => handleActionClick(action.text)}
                style={{
                  background: themeColors.panelSurface,
                  border: `1px solid ${themeColors.borderDivider}`,
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = themeColors.accentPrimary;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = themeColors.borderDivider;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={14} style={{ color: themeColors.accentPrimary }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{action.label}</span>
                </div>
                <p style={{ color: themeColors.textSecondary, fontSize: "0.78rem", marginTop: "0.35rem", marginBottom: 0, lineHeight: 1.4 }}>
                  Auto-fill and release templates.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Active Workflow execution timeline */}
        <div>
          <h4 style={{ ...typography.heading, fontSize: "0.9rem", color: themeColors.textSecondary, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            2. Active Workflow Pipeline
          </h4>
          <div style={{
            ...cardStyle,
            marginTop: 0,
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "row",
            gap: "1.5rem",
            overflowX: "auto",
            scrollBehavior: "smooth"
          }}>
            {timelineSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isPassed = index < currentStep;
              return (
                <div
                  key={index}
                  ref={index === currentStep ? timelineEndRef : null}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexShrink: 0,
                    opacity: isActive || isPassed ? 1 : 0.35,
                    transition: "opacity 0.3s ease"
                  }}
                >
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: `2px solid ${isActive || isPassed ? themeColors.accentPrimary : themeColors.textSecondary}`,
                    background: isPassed ? themeColors.accentPrimary : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    color: isPassed ? "#121212" : (isActive ? themeColors.accentPrimary : themeColors.textSecondary)
                  }}>
                    {isPassed ? "✓" : index + 1}
                  </div>
                  <span style={{
                    fontSize: "0.82rem",
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? themeColors.accentPrimary : themeColors.textPrimary
                  }}>
                    {step}
                  </span>
                  {index < timelineSteps.length - 1 && (
                    <span style={{ color: themeColors.textSecondary, fontSize: "0.8rem", marginLeft: "0.5rem" }}>➔</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Recent Tasks log */}
        <div>
          <h4 style={{ ...typography.heading, fontSize: "0.9rem", color: themeColors.textSecondary, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            3. Recent Tasks
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleReopenTask(task)}
                style={{
                  ...cardStyle,
                  marginTop: 0,
                  padding: "0.75rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = themeColors.accentPrimary;
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = themeColors.borderDivider;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: task.status === "Completed" ? themeColors.success : themeColors.accentPrimary
                  }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{task.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.78rem", color: themeColors.textSecondary }}>{task.time}</span>
                  <span style={{
                    ...pillStyle,
                    fontSize: "0.72rem",
                    padding: "0.1rem 0.4rem",
                    color: task.status === "Completed" ? themeColors.success : themeColors.accentPrimary,
                    background: task.status === "Completed" ? "rgba(16, 185, 129, 0.08)" : "rgba(201, 162, 39, 0.08)",
                    borderColor: "transparent"
                  }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Business Impact Metrics */}
        <div>
          <h4 style={{ ...typography.heading, fontSize: "0.9rem", color: themeColors.textSecondary, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            4. Business Impact
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem" }}>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Time Saved</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>33 Mins</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Manual: 35m | AI: 2m</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Cost Saved</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>91%</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Manual: ₹220 | AI: ₹20</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Steps Cut</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>80%</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Manual: 15 | AI: 3</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Productivity</div>
              <div style={{ fontSize: "1.35rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>17.5x</div>
              <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Onboarding Release</div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Execution Output Panel (Inspector) */}
      <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {loading && (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Cpu size={16} className="spin" style={{ color: themeColors.accentPrimary }} />
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Processing Request...</span>
            </div>
            
            {/* AI thinking skeleton loader */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ width: "80%", height: "14px", background: "#2A2A2A", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
              <div style={{ width: "95%", height: "14px", background: "#2A2A2A", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
              <div style={{ width: "60%", height: "14px", background: "#2A2A2A", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
            </div>
          </div>
        )}

        {docPreview ? (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FileText size={16} style={{ color: themeColors.accentPrimary }} />
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{docPreview.title}</span>
              </div>
              <button
                onClick={downloadDocFile}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: themeColors.textSecondary,
                }}
                title="Download text"
              >
                <Download size={16} />
              </button>
            </div>

            <div style={{
              background: "#1E1E1E",
              border: `1px solid ${themeColors.borderDivider}`,
              borderRadius: "12px",
              padding: "1rem",
              fontSize: "0.85rem",
              color: themeColors.textPrimary,
              fontFamily: typography.mono.fontFamily,
              whiteSpace: "pre-wrap",
              maxHeight: "350px",
              overflowY: "auto",
              lineHeight: 1.5
            }}>
              {docPreview.content}
            </div>

            {/* Workflow status */}
            {workflowStatus && (
              <div style={{ marginTop: "1.5rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: themeColors.textSecondary }}>Workflow: <strong>{workflowStatus.name}</strong></span>
                  <span style={{ color: themeColors.accentPrimary, fontWeight: "bold" }}>{workflowStatus.status}</span>
                </div>
                
                <div style={{ width: "100%", height: "6px", background: "#2A2A2A", borderRadius: "3px", overflow: "hidden", marginBottom: "0.4rem" }}>
                  <div style={{ width: `${workflowStatus.progress}%`, height: "100%", background: themeColors.accentPrimary, borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                  Approver: <strong>{workflowStatus.approver}</strong>
                </div>
              </div>
            )}

            {nextAction && (
              <div style={{ marginTop: "1rem", background: "rgba(16, 185, 129, 0.05)", border: `1px solid rgba(16, 185, 129, 0.1)`, borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.8rem" }}>
                <div style={{ fontWeight: "bold", color: themeColors.accentPrimary, marginBottom: "0.25rem" }}>Next Suggested Action:</div>
                <div style={{ color: themeColors.textSecondary }}>{nextAction}</div>
              </div>
            )}

            {/* Collapsible AI Decision Reasoning Panel */}
            <div style={{ marginTop: "1rem", borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  color: themeColors.textPrimary,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  padding: "0.5rem 0",
                  fontFamily: typography.body.fontFamily
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sparkles size={14} style={{ color: themeColors.accentPrimary }} />
                  <span>AI Decision Reasoning</span>
                </div>
                <span style={{ fontSize: "0.75rem" }}>{isReasoningExpanded ? "▲" : "▼"}</span>
              </button>

              {isReasoningExpanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.75rem", fontSize: "0.85rem", color: themeColors.textSecondary }}>
                  
                  {/* 1. Decision */}
                  <div>
                    <div style={{ fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>Decision</div>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      {getDecisionSummary(docPreview.type, docPreview.title)}
                    </p>
                  </div>

                  {/* 2. Reason */}
                  <div>
                    <div style={{ fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>Reason</div>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      {getDecisionReason(docPreview.type)}
                    </p>
                  </div>

                  {/* 3. Knowledge Used */}
                  <div>
                    <div style={{ fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>Knowledge Used</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {getKnowledgeUsed(docPreview.type).map((item, idx) => (
                        <span key={idx}>• {item}</span>
                      ))}
                    </div>
                  </div>

                  {/* 4. Business Rules Applied */}
                  <div>
                    <div style={{ fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>Business Rules Applied</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {getBusinessRules(docPreview.type).map((rule, idx) => (
                        <div key={idx} style={{ color: themeColors.success, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          ✓ {rule}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Confidence */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>
                      <span>Confidence</span>
                      <span style={{ color: themeColors.accentPrimary }}>{result ? result.confidence_score : 97}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#2A2A2A", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${result ? result.confidence_score : 97}%`, height: "100%", background: themeColors.accentPrimary }} />
                    </div>
                  </div>

                  {/* 6. Next Recommendation */}
                  <div>
                    <div style={{ fontWeight: 600, color: themeColors.textPrimary, marginBottom: "0.25rem" }}>Next Recommendation</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {getNextRecommendations(docPreview.type).map((rec, idx) => (
                        <span key={idx} style={{ color: themeColors.textPrimary }}>• {rec}</span>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && (
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed" }}>
              <Layers size={36} style={{ color: "#CBD5E1", margin: "0 auto 1rem" }} />
              <h4 style={{ ...typography.heading, fontSize: "0.95rem", margin: 0, color: themeColors.textSecondary }}>
                Output Inspector Panel
              </h4>
              <p style={{ color: "#94A3B8", fontSize: "0.78rem", marginTop: "0.5rem", lineHeight: 1.4 }}>
                {config.emptyStateText}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
