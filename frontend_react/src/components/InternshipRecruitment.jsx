import { useState, useEffect } from "react";
import { 
  cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle, radius 
} from "../styles";
import { 
  User, Briefcase, Mail, Phone, GraduationCap, Award, Cpu, FileText, CheckCircle2, 
  XCircle, Calendar, MessageSquare, BarChart3, ChevronRight, Check, Send, Download,
  ExternalLink, FileCheck, HelpCircle
} from "lucide-react";

export default function InternshipRecruitment({ role }) {
  const currentRole = role || sessionStorage.getItem("userRole") || "Employee";

  // Mock Applicant Database
  const [applicants, setApplicants] = useState([
    {
      id: "app-1",
      name: "Rahul Sharma",
      email: "rahul.sharma@iitb.ac.in",
      phone: "+91 98765 43210",
      college: "IIT Bombay",
      degree: "B.Tech",
      branch: "Computer Science",
      cgpa: 9.2,
      skills: ["Python", "React", "Node.js", "SQL", "Git"],
      experience: "Self-taught projects, Google Summer of Code contributor.",
      appliedRole: "Software Engineering Intern",
      portfolio: "https://rahulsharma.dev",
      linkedin: "linkedin.com/in/rahul-sharma-iitb",
      github: "github.com/rahul-sharma-codes",
      appliedDate: "July 12, 2026",
      status: "Applied",
      resumeScore: 92,
      strengths: ["Strong problem solving", "Open source contributions", "GSoC pedigree"],
      weaknesses: ["Minimal corporate exposure"],
      missingSkills: ["Docker", "Kubernetes"],
      questions: ["Explain your GSoC project architecture?", "How do you optimize render cycles in React?"],
      rejectionReason: ""
    },
    {
      id: "app-2",
      name: "Ananya Sen",
      email: "ananya.sen@du.ac.in",
      phone: "+91 99887 76655",
      college: "Delhi University",
      degree: "MBA",
      branch: "Human Resources",
      cgpa: 8.5,
      skills: ["Talent Acquisition", "Excel", "Communication", "Conflict Resolution"],
      experience: "HR Executive at college placement cell.",
      appliedRole: "HR Management Intern",
      portfolio: "",
      linkedin: "linkedin.com/in/ananyasen-hr",
      github: "",
      appliedDate: "July 14, 2026",
      status: "Shortlisted",
      resumeScore: 84,
      strengths: ["Excellent interpersonal skills", "Placement coordinator credentials"],
      weaknesses: ["No experience with automated ATS tools"],
      missingSkills: ["Workday API", "SQL basics"],
      questions: ["Describe a time you solved a team conflict?", "How do you manage candidate interview drop-offs?"],
      rejectionReason: ""
    },
    {
      id: "app-3",
      name: "Vikram Malhotra",
      email: "vikram.m@srcc.edu",
      phone: "+91 91234 56789",
      college: "SRCC Delhi",
      degree: "B.Com",
      branch: "Finance & Accounts",
      cgpa: 9.5,
      skills: ["Financial Modeling", "Valuation", "Excel Macros", "SQL"],
      experience: "Summer Finance Associate at local advisory firm.",
      appliedRole: "Finance & Accounts Intern",
      portfolio: "",
      linkedin: "linkedin.com/in/vikram-finance-srcc",
      github: "github.com/vikram-finance",
      appliedDate: "July 15, 2026",
      status: "Interview Scheduled",
      resumeScore: 95,
      strengths: ["Near-perfect CGPA", "Strong Excel macros mastery", "Prior internship exposure"],
      weaknesses: ["Prefers working independently"],
      missingSkills: ["Tableau", "SAP Finance Module"],
      questions: ["Explain DCF valuation models?", "How do you trace invoice discrepancies?"],
      rejectionReason: "",
      interviewDetails: {
        date: "July 20, 2026",
        time: "11:00 AM",
        type: "Google Meet",
        meetLink: "https://meet.google.com/abc-xyz-123",
        interviewer: "Rajesh Patel (Finance Lead)"
      }
    },
    {
      id: "app-4",
      name: "Neha Gupta",
      email: "neha.g@nid.edu",
      phone: "+91 93456 78901",
      college: "National Institute of Design",
      degree: "B.Des",
      branch: "User Experience Design",
      cgpa: 8.8,
      skills: ["Figma", "User Research", "Prototyping", "Adobe Suite"],
      experience: "Freelance UI designer for 3 startups.",
      appliedRole: "UX Design Intern",
      portfolio: "https://nehadesigns.co",
      linkedin: "linkedin.com/in/neha-design-nid",
      github: "",
      appliedDate: "July 10, 2026",
      status: "Selected",
      resumeScore: 89,
      strengths: ["Rich visual portfolio", "High Figma tool proficiency"],
      weaknesses: ["Fewer technical front-end skills"],
      missingSkills: ["HTML/CSS basics", "React concepts"],
      questions: ["Walk us through your design process?", "Why did you select this layout for Acme App?"],
      rejectionReason: "",
      managerFeedback: {
        technical: 9,
        communication: 9,
        problemSolving: 8,
        confidence: 9,
        attitude: 10,
        overallRating: 9.0,
        comments: "Excellent portfolio. Fits corporate UX specifications perfectly.",
        recommendation: "Select"
      }
    }
  ]);

  // Selected candidate state
  const [selectedApplicant, setSelectedApplicant] = useState(applicants[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dynamic Views: "pipeline" (HR/Manager), "evaluator" (Manager/HR), "analytics" (HR), "chat" (HR), "candidateView" (Candidate)
  const [activeSubTab, setActiveSubTab] = useState("pipeline");

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("Skills not matching");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState({
    date: "2026-07-22",
    time: "14:00",
    type: "Google Meet",
    interviewer: (currentRole === "Manager" || currentRole === "Team Lead") ? "David Miller" : "Dev (VP Engineering)",
    notes: "Review coding profiles and algorithmic optimization basics."
  });

  // Manager evaluation state
  const [evalRatings, setEvalRatings] = useState({
    technical: 8,
    communication: 8,
    problemSolving: 8,
    confidence: 8,
    attitude: 9,
    comments: "",
    recommendation: "Select"
  });

  // Dynamic AI Recruiter assistant state
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatResponse, setAiChatResponse] = useState("");

  // Simulated notifications list
  const [recruitmentNotifications, setRecruitmentNotifications] = useState([
    { text: "New application received from Vikram Malhotra (Finance Intern)", time: "1 hour ago" },
    { text: "Manager submitted feedback for Neha Gupta: Select recommended", time: "3 hours ago" }
  ]);

  // Sync selected candidate
  const handleSelectApplicant = (app) => {
    setSelectedApplicant(app);
    // Reset manager evaluation input if opening scheduled candidates
    if (app.managerFeedback) {
      setEvalRatings({
        technical: app.managerFeedback.technical,
        communication: app.managerFeedback.communication,
        problemSolving: app.managerFeedback.problemSolving,
        confidence: app.managerFeedback.confidence,
        attitude: app.managerFeedback.attitude,
        comments: app.managerFeedback.comments,
        recommendation: app.managerFeedback.recommendation
      });
    }
  };

  // Pipeline execution triggers
  const handleShortlist = () => {
    const updated = applicants.map(app => 
      app.id === selectedApplicant.id ? { ...app, status: "Shortlisted" } : app
    );
    setApplicants(updated);
    const newSelected = updated.find(app => app.id === selectedApplicant.id);
    setSelectedApplicant(newSelected);
    
    // Add notification
    setRecruitmentNotifications([
      { text: `Candidate ${newSelected.name} has been Shortlisted (Interview Pending).`, time: "Just now" },
      ...recruitmentNotifications
    ]);
    alert(`Candidate ${newSelected.name} status updated to: Shortlisted (Interview Pending). Notifications dispatched.`);
  };

  const handleReject = () => {
    const updated = applicants.map(app => 
      app.id === selectedApplicant.id ? { ...app, status: "Rejected", rejectionReason: rejectReason } : app
    );
    setApplicants(updated);
    const newSelected = updated.find(app => app.id === selectedApplicant.id);
    setSelectedApplicant(newSelected);
    setShowRejectModal(false);

    // Add notification
    setRecruitmentNotifications([
      { text: `Professional rejection email successfully sent to ${newSelected.name}.`, time: "Just now" },
      ...recruitmentNotifications
    ]);
    alert(`Rejection registered for ${newSelected.name}. Automated rejection notice sent via email. Reason logged: ${rejectReason}.`);
  };

  const handleScheduleInterview = () => {
    const updated = applicants.map(app => 
      app.id === selectedApplicant.id ? { 
        ...app, 
        status: "Interview Scheduled",
        interviewDetails: {
          date: scheduleDetails.date,
          time: scheduleDetails.time,
          type: scheduleDetails.type,
          meetLink: `https://meet.google.com/mv-${selectedApplicant.id.toLowerCase()}-schedule`,
          interviewer: scheduleDetails.interviewer
        }
      } : app
    );
    setApplicants(updated);
    const newSelected = updated.find(app => app.id === selectedApplicant.id);
    setSelectedApplicant(newSelected);
    setShowScheduleModal(false);

    // Add notification
    setRecruitmentNotifications([
      { text: `Interview scheduled for ${newSelected.name} with ${scheduleDetails.interviewer}. Calendar invite sent.`, time: "Just now" },
      ...recruitmentNotifications
    ]);
    alert(`Interview successfully scheduled for ${newSelected.name}. Calendar invitation and Google Meet details sent.`);
  };

  const handleSubmitEvaluation = () => {
    const overall = ((evalRatings.technical + evalRatings.communication + evalRatings.problemSolving + evalRatings.confidence + evalRatings.attitude) / 5).toFixed(1);
    const updated = applicants.map(app => 
      app.id === selectedApplicant.id ? { 
        ...app, 
        status: "Selected",
        managerFeedback: {
          ...evalRatings,
          overallRating: parseFloat(overall)
        }
      } : app
    );
    setApplicants(updated);
    const newSelected = updated.find(app => app.id === selectedApplicant.id);
    setSelectedApplicant(newSelected);

    // Add notification
    setRecruitmentNotifications([
      { text: `Manager submitted evaluation feedback for ${newSelected.name} (Rating: ${overall}/10).`, time: "Just now" },
      ...recruitmentNotifications
    ]);
    alert(`Manager evaluation submitted. Recommended: ${evalRatings.recommendation}. Candidate has been moved to HR final decision stage.`);
  };

  const handleHRFinalDecision = (decision) => {
    if (decision === "Approve") {
      const updated = applicants.map(app => 
        app.id === selectedApplicant.id ? { 
          ...app, 
          status: "Onboarded",
          internDetails: {
            employeeId: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
            email: `${selectedApplicant.name.toLowerCase().replace(" ", ".")}@mindvault.ai`,
            joiningDate: "August 1, 2026",
            manager: selectedApplicant.interviewDetails?.interviewer || "David Miller",
            hrBuddy: "Gayathri Arra",
            location: "GCP Hyderabad - Office Campus"
          }
        } : app
      );
      setApplicants(updated);
      const newSelected = updated.find(app => app.id === selectedApplicant.id);
      setSelectedApplicant(newSelected);

      // Add notification
      setRecruitmentNotifications([
        { text: `Offer Letter PDF generated and credentials sent automatically to ${newSelected.name}.`, time: "Just now" },
        { text: `Candidate ${newSelected.name} successfully onboarded as Intern.`, time: "Just now" },
        ...recruitmentNotifications
      ]);
      alert(`Candidate approved! Internship ID generated, employee database account created, and offer letter PDF sent automatically via email.`);
    } else {
      // Reject from final round
      const updated = applicants.map(app => 
        app.id === selectedApplicant.id ? { ...app, status: "Rejected", rejectionReason: "Rejected during final HR evaluation round." } : app
      );
      setApplicants(updated);
      const newSelected = updated.find(app => app.id === selectedApplicant.id);
      setSelectedApplicant(newSelected);
      alert(`Candidate rejected during final evaluation. Rejection email sent.`);
    }
  };

  // AI assistant queries matching ATS database
  const handleAiQuerySubmit = (e) => {
    if (e) e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const q = aiChatQuery.toLowerCase();
    let response = "";

    if (q.includes("best suited") || q.includes("who is best") || q.includes("rank")) {
      response = "Based on B.Tech CS degree background and 92/100 resume match score, Rahul Sharma is the best suited candidate for the Software Engineering Intern role. Vikram Malhotra ranks highest overall with a 95/100 resume score for the Finance & Accounts internship.";
    } else if (q.includes("python")) {
      const matches = applicants.filter(app => app.skills.includes("Python")).map(app => app.name);
      response = `Python experience detected in applicant: ${matches.join(", ")} (Resume Score: 92%).`;
    } else if (q.includes("score")) {
      response = "The applicant with the highest Resume Score is Vikram Malhotra (SRCC Delhi, Finance) with a score of 95/100, followed closely by Rahul Sharma (IIT Bombay, CS) with 92/100.";
    } else if (q.includes("recommend interview questions") || q.includes("question")) {
      response = `Recommended questions for ${selectedApplicant.name}:\n${selectedApplicant.questions.map(q => `• ${q}`).join("\n")}`;
    } else if (q.includes("summarize")) {
      response = `Summary for ${selectedApplicant.name}:\n- Education: ${selectedApplicant.degree} (${selectedApplicant.branch}) from ${selectedApplicant.college} (CGPA: ${selectedApplicant.cgpa})\n- Top Skills: ${selectedApplicant.skills.join(", ")}\n- Experience Summary: ${selectedApplicant.experience}\n- AI Score: ${selectedApplicant.resumeScore}/100`;
    } else {
      response = "I have scanned the applicant records. Vikram Malhotra (Finance Lead: 95%) and Rahul Sharma (CS Lead: 92%) show the strongest credentials matches for engineering and financial departments. Let me know if you would like me to summarize their profiles or prepare customized interview questions.";
    }

    setAiChatResponse(response);
  };

  const handleQuickQuestion = (text) => {
    setAiChatQuery(text);
  };

  // Filtered applicants
  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.appliedRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      
      {/* Dynamic Sub-tab navigation */}
      {currentRole !== "Applicant" && (
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
          {(currentRole === "HR" || currentRole === "HR Manager") && (
            <>
              <button 
                onClick={() => setActiveSubTab("pipeline")} 
                style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", background: activeSubTab === "pipeline" ? themeColors.accentPrimary : "transparent", color: activeSubTab === "pipeline" ? "#121212" : themeColors.textPrimary, border: activeSubTab === "pipeline" ? "none" : `1px solid ${themeColors.borderDivider}` }}
              >
                Applications Pipeline
              </button>
              <button 
                onClick={() => setActiveSubTab("analytics")} 
                style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", background: activeSubTab === "analytics" ? themeColors.accentPrimary : "transparent", color: activeSubTab === "analytics" ? "#121212" : themeColors.textPrimary, border: activeSubTab === "analytics" ? "none" : `1px solid ${themeColors.borderDivider}` }}
              >
                Funnel Analytics
              </button>
              <button 
                onClick={() => setActiveSubTab("chat")} 
                style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", background: activeSubTab === "chat" ? themeColors.accentPrimary : "transparent", color: activeSubTab === "chat" ? "#121212" : themeColors.textPrimary, border: activeSubTab === "chat" ? "none" : `1px solid ${themeColors.borderDivider}` }}
              >
                AI Recruiter Assistant
              </button>
            </>
          )}

          {(currentRole === "Manager" || currentRole === "Team Lead") && (
            <>
              <button 
                onClick={() => setActiveSubTab("pipeline")} 
                style={{ ...buttonStyle, marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", background: activeSubTab === "pipeline" ? themeColors.accentPrimary : "transparent", color: activeSubTab === "pipeline" ? "#121212" : themeColors.textPrimary, border: activeSubTab === "pipeline" ? "none" : `1px solid ${themeColors.borderDivider}` }}
              >
                Interview Pipeline
              </button>
            </>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. PIPELINE & RESUME SCREENING VIEW                  */}
      {/* ==================================================== */}
      {activeSubTab === "pipeline" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          
          {/* Left Column: Applicant Directory & Pipeline List */}
          <div style={{ flex: "1.2 1 400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1.5rem" }}>
              <h3 style={{ ...typography.heading, fontSize: "1.1rem", margin: "0 0 1rem" }}>
                ATS Applications Directory
              </h3>

              {/* Search & Filters */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Search by name, college, or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem 0.75rem", fontSize: "0.8rem", flex: 1 }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem 0.75rem", fontSize: "0.8rem", width: "130px" }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected</option>
                  <option value="Onboarded">Onboarded</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Applicant list table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto" }}>
                {filteredApplicants.length === 0 ? (
                  <p style={{ color: themeColors.textSecondary, fontSize: "0.8rem", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                    No applicant records match current filters.
                  </p>
                ) : (
                  filteredApplicants.map((app) => {
                    const isSelected = selectedApplicant.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleSelectApplicant(app)}
                        style={{
                          background: isSelected ? "rgba(201,162,39,0.06)" : "#222222",
                          border: `1px solid ${isSelected ? themeColors.accentPrimary : themeColors.borderDivider}`,
                          borderRadius: "10px",
                          padding: "0.75rem 1rem",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.2s"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{app.name}</div>
                          <div style={{ fontSize: "0.72rem", color: themeColors.textSecondary, marginTop: "0.15rem" }}>
                            {app.college} • {app.appliedRole}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                          <span style={{
                            ...pillStyle,
                            fontSize: "0.65rem",
                            padding: "0.1rem 0.35rem",
                            borderColor: "transparent",
                            color: app.status === "Rejected" ? themeColors.danger : (app.status === "Onboarded" ? themeColors.success : themeColors.accentPrimary),
                            background: app.status === "Rejected" ? "rgba(239,68,68,0.08)" : (app.status === "Onboarded" ? "rgba(16,185,129,0.08)" : "rgba(201,162,39,0.08)")
                          }}>
                            {app.status}
                          </span>
                          <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: themeColors.textSecondary }}>
                            Score: {app.resumeScore}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Simulated Live ATS System Notification Logs */}
            <div style={{ ...cardStyle, marginTop: 0, padding: "1.25rem" }}>
              <h4 style={{ ...typography.heading, fontSize: "0.85rem", margin: "0 0 0.75rem", color: themeColors.textSecondary }}>
                Live ATS Notification Trails
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recruitmentNotifications.slice(0, 3).map((notif, index) => (
                  <div key={index} style={{ fontSize: "0.75rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.5rem" }}>
                    <div style={{ color: themeColors.textPrimary }}>{notif.text}</div>
                    <div style={{ color: themeColors.textSecondary, fontSize: "0.65rem", marginTop: "0.15rem" }}>{notif.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Profile & Resume Screening viewer */}
          <div style={{ flex: "1.8 1 500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {selectedApplicant ? (
              <div style={{ ...cardStyle, marginTop: 0, padding: "2rem" }}>
                
                {/* Header Information */}
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                  <div>
                    <h2 style={{ ...typography.heading, fontSize: "1.4rem", margin: 0 }}>
                      {selectedApplicant.name}
                    </h2>
                    <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0.25rem 0" }}>
                      🎓 {selectedApplicant.degree} in {selectedApplicant.branch} ({selectedApplicant.college} | CGPA: {selectedApplicant.cgpa})
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      <span style={{ ...pillStyle, fontSize: "0.72rem", background: "rgba(201,162,39,0.08)", color: themeColors.accentPrimary, borderColor: "transparent" }}>
                        Role: {selectedApplicant.appliedRole}
                      </span>
                      <span style={{ ...pillStyle, fontSize: "0.72rem", background: "#222222" }}>
                        Status: <strong>{selectedApplicant.status}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions based on role and status */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    {(currentRole === "HR" || currentRole === "HR Manager") && selectedApplicant.status === "Applied" && (
                      <>
                        <button onClick={handleShortlist} style={{ ...buttonStyle, marginTop: 0, background: themeColors.success, color: "#FFFFFF", border: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                          Accept for Interview
                        </button>
                        <button onClick={() => setShowRejectModal(true)} style={{ ...buttonStyle, marginTop: 0, background: themeColors.danger, color: "#FFFFFF", border: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                          Reject Application
                        </button>
                      </>
                    )}

                    {(currentRole === "HR" || currentRole === "HR Manager") && selectedApplicant.status === "Shortlisted" && (
                      <button onClick={() => setShowScheduleModal(true)} style={{ ...buttonStyle, marginTop: 0, background: themeColors.accentPrimary, color: "#121212", border: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                        <Calendar size={12} style={{ marginRight: "0.25rem" }} /> Schedule Interview
                      </button>
                    )}

                    {(currentRole === "HR" || currentRole === "HR Manager") && selectedApplicant.status === "Selected" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleHRFinalDecision("Approve")} style={{ ...buttonStyle, marginTop: 0, background: themeColors.success, color: "#FFFFFF", border: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                          <Check size={12} /> Approve & Send Offer
                        </button>
                        <button onClick={() => handleHRFinalDecision("Reject")} style={{ ...buttonStyle, marginTop: 0, background: themeColors.danger, color: "#FFFFFF", border: "none", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                          Reject Candidate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Layout: Profile Resume Text vs AI screening insights */}
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  
                  {/* Visual Resume Sheet */}
                  <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "#1E1E1E", border: `1px solid ${themeColors.borderDivider}`, borderRadius: radius.md, padding: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Resume Preview</span>
                        <Download size={14} style={{ cursor: "pointer", color: themeColors.textSecondary }} onClick={() => alert("Resume document successfully downloaded.")} />
                      </div>

                      <div style={{ fontSize: "0.78rem", color: themeColors.textPrimary, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div>
                          <strong>Contact Info:</strong><br/>
                          ✉️ {selectedApplicant.email}<br/>
                          📞 {selectedApplicant.phone}
                        </div>
                        <div>
                          <strong>Top Skills:</strong><br/>
                          {selectedApplicant.skills.join(", ")}
                        </div>
                        <div>
                          <strong>Education:</strong><br/>
                          {selectedApplicant.degree} in {selectedApplicant.branch} - {selectedApplicant.college}
                        </div>
                        <div>
                          <strong>Relevant Experience:</strong><br/>
                          <p style={{ margin: "0.2rem 0 0", color: themeColors.textSecondary, lineHeight: 1.4 }}>
                            {selectedApplicant.experience}
                          </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "0.5rem", display: "flex", gap: "0.75rem", fontSize: "0.7rem", color: themeColors.accentPrimary }}>
                          {selectedApplicant.linkedin && <a href="#linkedin" style={{ color: "inherit" }}>LinkedIn</a>}
                          {selectedApplicant.github && <a href="#github" style={{ color: "inherit" }}>GitHub</a>}
                          {selectedApplicant.portfolio && <a href="#portfolio" style={{ color: "inherit" }}>Portfolio</a>}
                        </div>
                      </div>
                    </div>

                    {/* Interview scheduled Details block */}
                    {selectedApplicant.interviewDetails && (
                      <div style={{ background: "rgba(201,162,39,0.04)", border: `1px solid rgba(201,162,39,0.15)`, borderRadius: radius.md, padding: "1rem" }}>
                        <h4 style={{ ...typography.heading, fontSize: "0.82rem", margin: "0 0 0.5rem", color: themeColors.accentPrimary, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Calendar size={12} /> Scheduled Interview details
                        </h4>
                        <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                          Date/Time: <strong>{selectedApplicant.interviewDetails.date} @ {selectedApplicant.interviewDetails.time}</strong><br/>
                          Interviewer: <strong>{selectedApplicant.interviewDetails.interviewer}</strong><br/>
                          Type: <strong>{selectedApplicant.interviewDetails.type}</strong><br/>
                          Meet Link: <a href={selectedApplicant.interviewDetails.meetLink} target="_blank" rel="noreferrer" style={{ color: themeColors.accentPrimary }}>Google Meet Join Link</a>
                        </div>
                      </div>
                    )}

                    {/* Onboarded Intern account credentials */}
                    {selectedApplicant.status === "Onboarded" && selectedApplicant.internDetails && (
                      <div style={{ background: "rgba(16,185,129,0.04)", border: `1px solid rgba(16,185,129,0.15)`, borderRadius: radius.md, padding: "1rem" }}>
                        <h4 style={{ ...typography.heading, fontSize: "0.82rem", margin: "0 0 0.5rem", color: themeColors.success, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <FileCheck size={12} /> Intern Onboarding Account Credentials
                        </h4>
                        <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                          Internship ID: <strong>{selectedApplicant.internDetails.employeeId}</strong><br/>
                          Corporate Email: <strong>{selectedApplicant.internDetails.email}</strong><br/>
                          Assigned Manager: <strong>{selectedApplicant.internDetails.manager}</strong><br/>
                          HR Buddy: <strong>{selectedApplicant.internDetails.hrBuddy}</strong><br/>
                          Login System Account status: <span style={{ color: themeColors.success, fontWeight: "bold" }}>ACTIVE</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI resume screening insights panel */}
                  <div style={{ flex: "1.2 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: themeColors.panelSurfaceRaised, border: `1px solid ${themeColors.borderDivider}`, borderRadius: radius.md, padding: "1.25rem" }}>
                      
                      {/* AI Resume score progress */}
                      <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Cpu size={14} style={{ color: themeColors.accentPrimary }} />
                          <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textPrimary }}>AI Resume Screening</span>
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: themeColors.accentPrimary }}>
                          Score: {selectedApplicant.resumeScore}/100
                        </span>
                      </div>

                      <div style={{ width: "100%", height: "6px", background: "#222222", borderRadius: "3px", overflow: "hidden", marginBottom: "1rem" }}>
                        <div style={{ width: `${selectedApplicant.resumeScore}%`, height: "100%", background: themeColors.accentPrimary }} />
                      </div>

                      {/* Strengths / Weaknesses */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem" }}>
                        <div>
                          <strong style={{ color: themeColors.success }}>Strengths:</strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.25rem" }}>
                            {selectedApplicant.strengths.map((str, idx) => (
                              <span key={idx}>✓ {str}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <strong style={{ color: themeColors.danger }}>Weaknesses / Missing:</strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.25rem", color: themeColors.textSecondary }}>
                            {selectedApplicant.weaknesses.map((w, idx) => (
                              <span key={idx}>• {w}</span>
                            ))}
                            {selectedApplicant.missingSkills.length > 0 && (
                              <span style={{ color: "#E29E27" }}>• Missing: {selectedApplicant.missingSkills.join(", ")}</span>
                            )}
                          </div>
                        </div>

                        {/* Interview questions recommendation */}
                        <div>
                          <strong style={{ color: themeColors.textPrimary }}>Recommended Interview Questions:</strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem", fontStyle: "italic", color: themeColors.textSecondary }}>
                            {selectedApplicant.questions.map((q, idx) => (
                              <span key={idx}>&ldquo;{q}&rdquo;</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manager evaluation Feedback preview (if completed) */}
                    {selectedApplicant.managerFeedback && (
                      <div style={{ background: themeColors.panelSurfaceRaised, border: `1px solid ${themeColors.borderDivider}`, borderRadius: radius.md, padding: "1.25rem", fontSize: "0.75rem" }}>
                        <div style={{ fontWeight: "bold", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.4rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                          <span>Manager Evaluation Rating</span>
                          <span style={{ color: themeColors.accentPrimary }}>Rating: {selectedApplicant.managerFeedback.overallRating}/10</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", color: themeColors.textSecondary }}>
                          <div>Technical: <strong>{selectedApplicant.managerFeedback.technical}/10</strong></div>
                          <div>Communication: <strong>{selectedApplicant.managerFeedback.communication}/10</strong></div>
                          <div>Problem Solving: <strong>{selectedApplicant.managerFeedback.problemSolving}/10</strong></div>
                          <div>Confidence: <strong>{selectedApplicant.managerFeedback.confidence}/10</strong></div>
                        </div>
                        <div style={{ marginTop: "0.5rem", color: themeColors.textPrimary }}>
                          Comments: &ldquo;{selectedApplicant.managerFeedback.comments}&rdquo;
                        </div>
                        <div style={{ marginTop: "0.4rem", fontWeight: "bold", color: selectedApplicant.managerFeedback.recommendation === "Select" ? themeColors.success : themeColors.danger }}>
                          Recommendation: {selectedApplicant.managerFeedback.recommendation}
                        </div>
                      </div>
                    )}

                    {/* If Team Lead/Manager: display interview conduct rating form */}
                    {(currentRole === "Manager" || currentRole === "Team Lead") && selectedApplicant.status === "Interview Scheduled" && (
                      <div style={{ background: "rgba(201,162,39,0.02)", border: `1px solid ${themeColors.borderDivider}`, borderRadius: radius.md, padding: "1.25rem" }}>
                        <h4 style={{ ...typography.heading, fontSize: "0.85rem", margin: "0 0 0.75rem", color: themeColors.accentPrimary }}>
                          Submit Interview Evaluation
                        </h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem" }}>
                          <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                            <span>Technical Skills (1-10)</span>
                            <input type="number" min="1" max="10" value={evalRatings.technical} onChange={(e) => setEvalRatings({ ...evalRatings, technical: parseInt(e.target.value) || 8 })} style={{ ...inputStyle, width: "50px", padding: "0.25rem", textAlign: "center" }} />
                          </div>
                          <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                            <span>Communication (1-10)</span>
                            <input type="number" min="1" max="10" value={evalRatings.communication} onChange={(e) => setEvalRatings({ ...evalRatings, communication: parseInt(e.target.value) || 8 })} style={{ ...inputStyle, width: "50px", padding: "0.25rem", textAlign: "center" }} />
                          </div>
                          <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                            <span>Problem Solving (1-10)</span>
                            <input type="number" min="1" max="10" value={evalRatings.problemSolving} onChange={(e) => setEvalRatings({ ...evalRatings, problemSolving: parseInt(e.target.value) || 8 })} style={{ ...inputStyle, width: "50px", padding: "0.25rem", textAlign: "center" }} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
                            <span>Comments</span>
                            <textarea placeholder="Candidate evaluation notes..." value={evalRatings.comments} onChange={(e) => setEvalRatings({ ...evalRatings, comments: e.target.value })} rows={2} style={{ ...inputStyle, resize: "none", padding: "0.5rem" }} />
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.4rem" }}>
                            <span>Recommendation</span>
                            <select value={evalRatings.recommendation} onChange={(e) => setEvalRatings({ ...evalRatings, recommendation: e.target.value })} style={{ ...inputStyle, padding: "0.3rem", width: "100px" }}>
                              <option value="Select">Select</option>
                              <option value="Reject">Reject</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </div>

                          <button onClick={handleSubmitEvaluation} style={{ ...buttonStyle, width: "100%", marginTop: "0.5rem", background: themeColors.accentPrimary, color: "#121212", border: "none", fontSize: "0.8rem", padding: "0.4rem" }}>
                            Submit Evaluation
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            ) : (
              <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed" }}>
                <User size={36} style={{ color: themeColors.textSecondary, margin: "0 auto 1rem" }} />
                <h4 style={{ ...typography.heading, fontSize: "0.95rem", margin: 0, color: themeColors.textSecondary }}>
                  Select Applicant Profile
                </h4>
                <p style={{ color: "#94A3B8", fontSize: "0.78rem", marginTop: "0.5rem" }}>
                  Select a candidate from the left list directory to open the resume inspector and AI screening charts.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* 2. ANALYTICS                                         */}
      {/* ==================================================== */}
      {activeSubTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* KPI Dashboard Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Total Applications</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: themeColors.textPrimary, marginTop: "0.25rem" }}>142</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Shortlisted</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>32</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Interview Scheduled</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: themeColors.accentPrimary, marginTop: "0.25rem" }}>12</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Average Resume Score</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: themeColors.success, marginTop: "0.25rem" }}>86.5%</div>
            </div>
            <div style={{ ...cardStyle, marginTop: 0, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", color: themeColors.textSecondary }}>Offers Accepted</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: themeColors.success, marginTop: "0.25rem" }}>4</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            
            {/* Funnel Chart (CSS mock) */}
            <div style={{ ...cardStyle, marginTop: 0, flex: "1.5 1 400px", padding: "1.5rem" }}>
              <h4 style={{ ...typography.heading, fontSize: "1rem", margin: "0 0 1.25rem" }}>
                Hiring Funnel Conversions
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Applications Received (100%)</span>
                    <strong>142</strong>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: themeColors.accentPrimary, borderRadius: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Resume Screened (70%)</span>
                    <strong>99</strong>
                  </div>
                  <div style={{ width: "70%", height: "8px", background: themeColors.accentPrimary, borderRadius: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Shortlisted (22%)</span>
                    <strong>32</strong>
                  </div>
                  <div style={{ width: "22%", height: "8px", background: themeColors.accentPrimary, borderRadius: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span>Interviews Cleared (6%)</span>
                    <strong>8</strong>
                  </div>
                  <div style={{ width: "6%", height: "8px", background: themeColors.success, borderRadius: "4px" }} />
                </div>
              </div>
            </div>

            {/* Top colleges list */}
            <div style={{ ...cardStyle, marginTop: 0, flex: "1 1 250px", padding: "1.5rem" }}>
              <h4 style={{ ...typography.heading, fontSize: "1rem", margin: "0 0 1rem" }}>
                Top Talents Feeders
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.3rem" }}>
                  <span>1. IIT Bombay</span>
                  <strong>24 Applicants</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.3rem" }}>
                  <span>2. SRCC Delhi</span>
                  <strong>18 Applicants</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.3rem" }}>
                  <span>3. BITS Pilani</span>
                  <strong>15 Applicants</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.3rem" }}>
                  <span>4. Delhi University</span>
                  <strong>12 Applicants</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* 3. AI RECRUITER ASSISTANT CHAT                       */}
      {/* ==================================================== */}
      {activeSubTab === "chat" && (
        <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div style={{ ...cardStyle, marginTop: 0, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Cpu size={20} style={{ color: themeColors.accentPrimary }} />
              <h3 style={{ ...typography.heading, fontSize: "1.2rem", margin: 0 }}>
                AI Recruitment Copilot
              </h3>
            </div>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Ask the assistant to rank candidates, retrieve skill matches, or compile custom interview worksheets.
            </p>

            {/* Chat viewport */}
            {aiChatResponse && (
              <div style={{ background: "#1E1E1E", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "12px", padding: "1.25rem", fontSize: "0.85rem", color: themeColors.textPrimary, whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: "1rem" }}>
                {aiChatResponse}
              </div>
            )}

            <form onSubmit={handleAiQuerySubmit} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={aiChatQuery}
                onChange={(e) => setAiChatQuery(e.target.value)}
                placeholder="Ask about candidate experience, scores, Python, etc..."
                style={inputStyle}
              />
              <button type="submit" style={{ ...buttonStyle, marginTop: 0, background: themeColors.accentPrimary, color: "#121212", border: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Send size={14} /> Send
              </button>
            </form>

            {/* Quick questions recommendation */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <button onClick={() => handleQuickQuestion("Who has the highest resume score?")} style={{ background: "transparent", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "8px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: themeColors.textSecondary, cursor: "pointer" }}>
                Who has the highest score?
              </button>
              <button onClick={() => handleQuickQuestion("Which candidates have Python experience?")} style={{ background: "transparent", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "8px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: themeColors.textSecondary, cursor: "pointer" }}>
                Python experience?
              </button>
              <button onClick={() => handleQuickQuestion("Summarize Rahul Sharma's resume details")} style={{ background: "transparent", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "8px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: themeColors.textSecondary, cursor: "pointer" }}>
                Summarize Rahul Sharma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. CANDIDATE / APPLICANT TRACKING TIMELINE           */}
      {/* ==================================================== */}
      {activeSubTab === "candidateView" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", width: "100%" }}>
          <div style={{ ...cardStyle, marginTop: 0, padding: "2rem" }}>
            <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
              Application Status Tracker
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "2rem" }}>
              Track the live interview evaluation and selection stages for your candidate profile.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { label: "Application Submitted", done: true, desc: "Successfully received by HR team on July 12, 2026." },
                { label: "Resume Screening (AI)", done: true, desc: "Checked. Match rating score generated: 92/100." },
                { label: "Shortlisted", done: true, desc: "Promoted to interview queue phase." },
                { label: "Interview Scheduled", done: false, desc: "Pending slots configuration." },
                { label: "Offer Letter Dispatched", done: false, desc: "Pending interview completion evaluations." }
              ].map((step, idx, arr) => (
                <div key={idx} style={{ display: "flex", gap: "1rem", position: "relative" }}>
                  {idx < arr.length - 1 && (
                    <div style={{ position: "absolute", left: "9px", top: "18px", bottom: "-24px", width: "2px", background: step.done ? themeColors.accentPrimary : "#333333" }} />
                  )}
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: step.done ? themeColors.accentPrimary : "#222222", border: `2px solid ${step.done ? themeColors.accentPrimary : "#333333"}`, display: "flex", alignItems: "center", justify: "center" }}>
                    {step.done && <Check size={10} style={{ color: "#121212" }} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: step.done ? themeColors.textPrimary : themeColors.textSecondary }}>{step.label}</span>
                    <span style={{ fontSize: "0.78rem", color: themeColors.textSecondary, marginTop: "0.15rem" }}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* REJECTION REASON MODAL                               */}
      {/* ==================================================== */}
      {showRejectModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", alignItems: "center", justify: "center" }}>
          <div style={{ ...cardStyle, width: "90%", maxWidth: "400px", background: "#1A1A1A" }}>
            <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: "0 0 1rem" }}>
              Select Rejection Reason
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={inputStyle}>
                <option value="Skills not matching">Skills not matching</option>
                <option value="Low CGPA">Low CGPA</option>
                <option value="Position filled">Position filled</option>
                <option value="Resume incomplete">Resume incomplete</option>
                <option value="Other">Other</option>
              </select>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button onClick={() => setShowRejectModal(false)} style={{ ...buttonStyle, marginTop: 0, background: "transparent", border: `1px solid ${themeColors.borderDivider}`, color: themeColors.textPrimary, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Cancel
                </button>
                <button onClick={handleReject} style={{ ...buttonStyle, marginTop: 0, background: themeColors.danger, color: "#FFFFFF", border: "none", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* INTERVIEW SCHEDULING MODAL                          */}
      {/* ==================================================== */}
      {showScheduleModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", alignItems: "center", justify: "center" }}>
          <div style={{ ...cardStyle, width: "90%", maxWidth: "450px", background: "#1A1A1A" }}>
            <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: "0 0 1rem" }}>
              Schedule Interview with {selectedApplicant.name}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8rem" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Interview Date</span>
                <input type="date" value={scheduleDetails.date} onChange={(e) => setScheduleDetails({ ...scheduleDetails, date: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Interview Time</span>
                <input type="time" value={scheduleDetails.time} onChange={(e) => setScheduleDetails({ ...scheduleDetails, time: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Interviewer Name</span>
                <input type="text" value={scheduleDetails.interviewer} onChange={(e) => setScheduleDetails({ ...scheduleDetails, interviewer: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Internal Notes</span>
                <textarea value={scheduleDetails.notes} onChange={(e) => setScheduleDetails({ ...scheduleDetails, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "none" }} />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button onClick={() => setShowScheduleModal(false)} style={{ ...buttonStyle, marginTop: 0, background: "transparent", border: `1px solid ${themeColors.borderDivider}`, color: themeColors.textPrimary, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Cancel
                </button>
                <button onClick={handleScheduleInterview} style={{ ...buttonStyle, marginTop: 0, background: themeColors.accentPrimary, color: "#121212", border: "none", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
