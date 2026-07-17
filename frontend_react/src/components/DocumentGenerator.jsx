import { useState, useEffect } from "react";
import axios from "axios";
import { generateEmail, generateReport, generateQuotation, generateInvoice, generateQuestionPaper, generatePPT } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle, linkButtonStyle } from "../styles";
import EmptyState from "./EmptyState";
import { Mail, FileText, Lightbulb, ShieldAlert } from "lucide-react";

const TEMPLATES = [
  "Leave Request",
  "Customer Reply",
  "Offer Letter",
  "Meeting Invitation",
  "Reminder",
  "Escalation",
  "Complaint Response"
];

const TONES = [
  "Professional",
  "Casual",
  "Empathetic",
  "Urgently",
  "Direct"
];

const REPORT_TYPES = [
  "Weekly Report",
  "Monthly Report",
  "Department Report",
  "Project Report",
  "Sales Report",
  "Performance Report"
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function DocumentGenerator({ apiKey }) {
  const [subTab, setSubTab] = useState("email"); // 'email', 'business_docs', 'slides'

  // --- 1. EMAIL STATES ---
  const [emailTemplate, setEmailTemplate] = useState(TEMPLATES[0]);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailTone, setEmailTone] = useState(TONES[0]);
  const [emailDetails, setEmailDetails] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);

  // --- 2. BUSINESS DOCS STATES ---
  const [documentType, setDocumentType] = useState("Report");
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  
  const [clientName, setClientName] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days of quotation date.");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState([{ description: "", qty: 1, rate: 0 }]);
  
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);

  const [docLoading, setDocLoading] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [docError, setDocError] = useState("");
  const [recentReports, setRecentReports] = useState([]);
  const [exportingFormat, setExportingFormat] = useState(null);

  // --- 3. SLIDES STATES ---
  const [pptTopic, setPptTopic] = useState("");
  const [pptLoadingMode, setPptLoadingMode] = useState(null); // 'custom', 'insights', or null
  const [pptError, setPptError] = useState(null);

  // --- EMAIL HANDLERS ---
  async function handleGenerateEmail(e) {
    e.preventDefault();
    if (!emailRecipient.trim()) {
      setEmailError("Please specify a recipient.");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    setEmailResult(null);
    setEmailCopied(false);
    try {
      const data = await generateEmail({
        template_type: emailTemplate,
        recipient: emailRecipient.trim(),
        tone: emailTone,
        details: emailDetails,
        api_key: apiKey
      });
      setEmailResult(data);
    } catch (err) {
      console.error(err);
      setEmailError(err?.response?.data?.detail || "Failed to generate email.");
    } finally {
      setEmailLoading(false);
    }
  }

  const handleCopyEmail = () => {
    if (!emailResult) return;
    const fullText = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    navigator.clipboard.writeText(fullText);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleDownloadEmail = () => {
    if (!emailResult) return;
    const fullText = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `email_${emailTemplate.toLowerCase().replace(/ /g, "_")}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- BUSINESS DOCS HANDLERS ---
  const handleAddItem = () => {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const fetchRecentReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard`);
      setRecentReports(response.data?.memory?.recent_reports || []);
    } catch (e) {
      console.error("Failed to load recent reports", e);
    }
  };

  useEffect(() => {
    if (subTab === "business_docs") {
      fetchRecentReports();
    }
  }, [subTab, docResult]);

  async function handleGenerateDoc(e) {
    e.preventDefault();
    setDocLoading(true);
    setDocError("");
    setDocResult(null);
    try {
      const textBasedDocs = ["Report", "Meeting Minutes", "Offer Letter", "HR Letter", "Experience Certificate", "Policy", "Business Proposal"];
      
      if (textBasedDocs.includes(documentType)) {
        if (!reportTitle.trim()) {
          setDocError("Please specify a document title.");
          setDocLoading(false);
          return;
        }
        const data = await generateReport({
          report_type: documentType,
          title: reportTitle.trim(),
          details: reportDetails,
          api_key: apiKey
        });
        setDocResult(data);
      } else if (documentType === "Quotation") {
        if (!clientName.trim()) {
          setDocError("Please specify a client name.");
          setDocLoading(false);
          return;
        }
        const blobData = await generateQuotation({
          client_name: clientName.trim(),
          items: items.map(item => ({
            description: item.description,
            qty: parseInt(item.qty) || 0,
            rate: parseFloat(item.rate) || 0.0
          })),
          terms,
          api_key: apiKey
        });
        const blob = new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Quotation_${clientName.trim().replace(/\s+/g, "_")}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDocResult({
          title: `Quotation for ${clientName}`,
          content: `Quotation DOCX successfully generated and downloaded.\n\nClient: ${clientName}\nSubtotal: $${items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0).toFixed(2)}\nGST (18%): $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 0.18).toFixed(2)}\nGrand Total: $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 1.18).toFixed(2)}`
        });
      } else if (documentType === "Invoice") {
        if (!clientName.trim() || !invoiceNo.trim()) {
          setDocError("Please specify client name and invoice number.");
          setDocLoading(false);
          return;
        }
        const blobData = await generateInvoice({
          invoice_no: invoiceNo.trim(),
          client_name: clientName.trim(),
          items: items.map(item => ({
            description: item.description,
            qty: parseInt(item.qty) || 0,
            rate: parseFloat(item.rate) || 0.0
          })),
          due_date: dueDate,
          api_key: apiKey
        });
        const blob = new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Invoice_${invoiceNo.trim()}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDocResult({
          title: `Invoice #${invoiceNo} for ${clientName}`,
          content: `Invoice DOCX successfully generated and downloaded.\n\nInvoice No: ${invoiceNo}\nDue Date: ${dueDate}\nSubtotal: $${items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0).toFixed(2)}\nGST (18%): $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 0.18).toFixed(2)}\nGrand Total: $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 1.18).toFixed(2)}`
        });
      } else if (documentType === "Question Paper") {
        if (!topic.trim()) {
          setDocError("Please specify a topic.");
          setDocLoading(false);
          return;
        }
        const data = await generateQuestionPaper({
          topic: topic.trim(),
          difficulty,
          num_questions: numQuestions,
          api_key: apiKey
        });
        setDocResult(data);
      }
    } catch (err) {
      console.error(err);
      setDocError(err?.response?.data?.detail || "Failed to generate document.");
    } finally {
      setDocLoading(false);
    }
  }

  const handleExportDoc = async (reportId, format) => {
    setExportingFormat({ id: reportId, format });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/exports/report/${reportId}`, {
        params: { format },
        responseType: "blob"
      });
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export report", err);
      alert("Failed to export report in " + format.toUpperCase() + " format.");
    } finally {
      setExportingFormat(null);
    }
  };

  // --- SLIDES HANDLERS ---
  const handleDownloadPPT = async (mode) => {
    setPptError(null);
    setPptLoadingMode(mode);
    try {
      const payload = {
        mode,
        api_key: apiKey || null,
        topic: mode === "custom" ? pptTopic : null,
      };

      const blob = await generatePPT(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = mode === "custom" 
        ? `mindvault_${pptTopic.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${timestamp}.pptx`
        : `mindvault_insights_${timestamp}.pptx`;
        
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setPptError(parsed.detail || "An error occurred while generating the presentation.");
        } catch (e) {
          setPptError("An error occurred while generating the presentation.");
        }
      } else {
        setPptError(err.response?.data?.detail || "An error occurred while generating the presentation.");
      }
    } finally {
      setPptLoadingMode(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Tab Navigation */}
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
          { id: "email", label: "📧 Email Generator", icon: Mail },
          { id: "business_docs", label: "📝 Business Documents & Forms", icon: FileText },
          { id: "slides", label: "💡 AI Presentation Slides", icon: Lightbulb }
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

      {/* --- A. EMAIL TAB --- */}
      {subTab === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>AI COMMUNICATOR</div>
            <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
              Email Generator Agent
            </h2>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Draft emails instantly. Specify templates, recipients, and custom directives.
            </p>

            {emailError && (
              <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1.5rem" }}>
                {emailError}
              </div>
            )}

            <form onSubmit={handleGenerateEmail} style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                    Select Email Template
                  </label>
                  <select
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Recipient
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Project Sponsor"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                      required
                    />
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Tone
                    </label>
                    <select
                      value={emailTone}
                      onChange={(e) => setEmailTone(e.target.value)}
                      style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
                    >
                      {TONES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={emailLoading} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
                  {emailLoading ? "Generating Draft..." : "Generate Corporate Email"}
                </button>
              </div>

              <div style={{ flex: "1.5 1 350px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                  Specific context or instructions
                </label>
                <textarea
                  placeholder="e.g. Requesting permission to access the team vault. Mention I've completed all required security training modules."
                  value={emailDetails}
                  onChange={(e) => setEmailDetails(e.target.value)}
                  rows={6}
                  style={{ ...inputStyle, resize: "vertical", height: "100%", minHeight: "150px" }}
                />
              </div>
            </form>
          </div>

          {!emailResult ? (
            <div style={cardStyle}>
              <EmptyState
                icon={Mail}
                title="No emails generated yet"
                description="Generated email drafts will appear here once you fill out the details above."
              />
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
                <h3 style={{ ...typography.heading, fontSize: "1.3rem", margin: 0 }}>
                  Generated Email Preview
                </h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handleCopyEmail}
                    style={{
                      background: "rgba(201, 162, 39, 0.25)",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "6px",
                      color: themeColors.textPrimary,
                      padding: "0.4rem 0.8rem",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600
                    }}
                  >
                    {emailCopied ? "Copied! ✓" : "Copy to Clipboard"}
                  </button>
                  <button
                    onClick={handleDownloadEmail}
                    style={{
                      background: themeColors.highlightAmber,
                      border: "none",
                      borderRadius: "6px",
                      color: themeColors.bgBase,
                      padding: "0.4rem 0.8rem",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600
                    }}
                  >
                    Download Email (.txt)
                  </button>
                </div>
              </div>

              <div style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem 0", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily, fontSize: "0.95rem" }}>
                  <strong>Subject:</strong> {emailResult.subject}
                </p>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", color: themeColors.textPrimary, lineHeight: 1.6, fontSize: "0.95rem" }}>
                  {emailResult.body}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- B. BUSINESS DOCUMENTS & FORMS TAB --- */}
      {subTab === "business_docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>AI STRUCTURED FORMS</div>
            <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
              Business Document Generator
            </h2>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Generate comprehensive reports, professional quotations, billing invoices, or exam papers.
            </p>

            {/* Sub-document pill selector */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {["Report", "Meeting Minutes", "Offer Letter", "HR Letter", "Experience Certificate", "Policy", "Business Proposal", "Quotation", "Invoice", "Question Paper"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocumentType(type)}
                  style={{
                    background: documentType === type ? "rgba(201, 162, 39, 0.25)" : "transparent",
                    color: documentType === type ? themeColors.textPrimary : themeColors.textSecondary,
                    border: documentType === type ? `1px solid ${themeColors.accentPrimary}` : `1px solid ${themeColors.borderDivider}`,
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: typography.body.fontFamily,
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  {type === "Report" && "📝 "}
                  {type === "Meeting Minutes" && "⏱️ "}
                  {type === "Offer Letter" && "✉️ "}
                  {type === "HR Letter" && "📄 "}
                  {type === "Experience Certificate" && "🎓 "}
                  {type === "Policy" && "🛡️ "}
                  {type === "Business Proposal" && "💼 "}
                  {type === "Quotation" && "💬 "}
                  {type === "Invoice" && "💵 "}
                  {type === "Question Paper" && "📚 "}
                  {type}
                </button>
              ))}
            </div>

            {docError && (
              <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1.5rem" }}>
                {docError}
              </div>
            )}

            <form onSubmit={handleGenerateDoc} style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              {["Report", "Meeting Minutes", "Offer Letter", "HR Letter", "Experience Certificate", "Policy", "Business Proposal"].includes(documentType) && (
                <>
                  <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {documentType === "Report" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                          Report Sub-Category
                        </label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
                        >
                          {REPORT_TYPES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                        {documentType} Title / Heading
                      </label>
                      <input
                        type="text"
                        placeholder={
                          documentType === "Meeting Minutes" ? "e.g. Weekly Sync Minutes - Jan 16" :
                          documentType === "Offer Letter" ? "e.g. Software Engineer Offer - Jessica Chen" :
                          documentType === "Experience Certificate" ? "e.g. Experience Certificate - Deepak Rao" :
                          documentType === "Policy" ? "e.g. Remote Work Policy v2.0" :
                          `e.g. Corporate ${documentType}`
                        }
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                        required
                      />
                    </div>

                    <button type="submit" disabled={docLoading} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
                      {docLoading ? "Drafting..." : `Generate ${documentType}`}
                    </button>
                  </div>

                  <div style={{ flex: "1.5 1 350px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Context & Details (Prompt Parameters)
                    </label>
                    <textarea
                      placeholder={
                        documentType === "Offer Letter" ? "e.g. Base salary: $120,000, Sign-on bonus: $5,000, Start date: August 1. Candidate name: Jessica Chen." :
                        documentType === "Meeting Minutes" ? "e.g. Attendees: Jessica, Deepak. Discussed API endpoints migration. Actions: Jessica to write frontend files, Deepak to configure DB tables." :
                        documentType === "Policy" ? "e.g. Standard operational hours: 9 AM - 6 PM local. Core hours: 10 AM - 4 PM. Core principles: flexibility, delivery-focus, documentation." :
                        documentType === "Business Proposal" ? "e.g. Project details: MindVault AI rollout. Deliverables: FastAPI backend upgrade, multi-format RAG. Timeline: 4 weeks." :
                        "e.g. Enter specific guidelines, names, parameters, or updates here..."
                      }
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={6}
                      style={{ ...inputStyle, resize: "vertical", height: "100%", minHeight: "150px" }}
                    />
                  </div>
                </>
              )}

              {(documentType === "Quotation" || documentType === "Invoice") && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    {documentType === "Invoice" && (
                      <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                          required
                        />
                      </div>
                    )}
                    <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                        Client Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                        required
                      />
                    </div>
                    {documentType === "Quotation" ? (
                      <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                          Terms & Conditions
                        </label>
                        <input
                          type="text"
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                        />
                      </div>
                    ) : (
                      <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                      Line Items
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            style={{ ...inputStyle, flex: "3", padding: "0.5rem" }}
                            required
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                            style={{ ...inputStyle, flex: "1", padding: "0.5rem" }}
                            required
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Rate ($)"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                            style={{ ...inputStyle, flex: "1.5", padding: "0.5rem" }}
                            required
                          />
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              style={{
                                background: "rgba(239, 91, 91, 0.2)",
                                border: "none",
                                borderRadius: "6px",
                                color: themeColors.confidenceLow,
                                padding: "0.5rem",
                                cursor: "pointer",
                                fontWeight: 600
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      style={{
                        background: "rgba(52, 211, 153, 0.15)",
                        border: "none",
                        borderRadius: "6px",
                        color: themeColors.confidenceHigh,
                        padding: "0.4rem 0.8rem",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginTop: "0.75rem"
                      }}
                    >
                      + Add Item
                    </button>
                  </div>

                  <button type="submit" disabled={docLoading} style={{ ...buttonStyle, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                    {docLoading ? "Generating..." : `Generate ${documentType}`}
                  </button>
                </div>
              )}

              {documentType === "Question Paper" && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                        Topic
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Corporate Ethics"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                        required
                      />
                    </div>
                    <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        style={{ ...inputStyle, padding: "0.6rem 1rem", background: "#1A1A1A" }}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                        No. of Questions
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                        style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={docLoading} style={{ ...buttonStyle, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                    {docLoading ? "Generating Question Paper..." : "Generate Question Paper"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {docResult && (
            <div style={cardStyle}>
              <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
                Preview: {docResult.title}
              </h3>
              <div style={{ background: "#1A1A1A", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.5rem" }}>
                <div style={{ color: themeColors.textPrimary, lineHeight: 1.6, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                  {docResult.content}
                </div>
              </div>
            </div>
          )}

          <div style={cardStyle}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
              Report History & Downloads
            </h3>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
              Download previously compiled reports as Word Documents (.docx) or PDFs.
            </p>

            {recentReports.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic", margin: 0 }}>No business reports generated yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "350px", overflowY: "auto" }}>
                {recentReports.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      background: "#1A1A1A",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "8px",
                      padding: "0.8rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: themeColors.textPrimary }}>📄 {rep.title}</div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Type: {rep.report_type} | Generated: {new Date(rep.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleExportDoc(rep.id, "docx")}
                        disabled={exportingFormat?.id === rep.id}
                        style={{
                          background: "rgba(201, 162, 39, 0.25)",
                          border: `1px solid ${themeColors.borderDivider}`,
                          borderRadius: "6px",
                          color: themeColors.textPrimary,
                          padding: "0.3rem 0.6rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}
                      >
                        {exportingFormat?.id === rep.id && exportingFormat?.format === "docx" ? "Exporting..." : "Word (DOCX)"}
                      </button>
                      <button
                        onClick={() => handleExportDoc(rep.id, "pdf")}
                        disabled={exportingFormat?.id === rep.id}
                        style={{
                          background: themeColors.highlightAmber,
                          border: "none",
                          borderRadius: "6px",
                          color: themeColors.bgBase,
                          padding: "0.3rem 0.6rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}
                      >
                        {exportingFormat?.id === rep.id && exportingFormat?.format === "pdf" ? "Exporting..." : "PDF"}
                      </button>
                      <button
                        onClick={() => handleExportDoc(rep.id, "markdown")}
                        disabled={exportingFormat?.id === rep.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${themeColors.borderDivider}`,
                          borderRadius: "6px",
                          color: themeColors.textPrimary,
                          padding: "0.3rem 0.6rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}
                      >
                        {exportingFormat?.id === rep.id && exportingFormat?.format === "markdown" ? "Exporting..." : "Markdown (MD)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- C. AI PRESENTATION SLIDES TAB --- */}
      {subTab === "slides" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>AI PRESENTATION SLIDES</div>
            <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
              PowerPoint Deck Scribe
            </h2>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Generate complete custom PowerPoint slide decks using Groq and python-pptx templates.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={sectionLabelStyle}>Presentation Topic / Prompt</label>
              <textarea
                value={pptTopic}
                onChange={(e) => setPptTopic(e.target.value)}
                placeholder="e.g. Breakdown of Security Guidelines & MFA Rollout Plan for 2026"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
              />
            </div>

            <button
              onClick={() => handleDownloadPPT("custom")}
              disabled={pptLoadingMode !== null || !pptTopic.trim()}
              style={{
                ...buttonStyle,
                opacity: pptLoadingMode !== null || !pptTopic.trim() ? 0.6 : 1,
                cursor: pptLoadingMode !== null || !pptTopic.trim() ? "not-allowed" : "pointer",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {pptLoadingMode === "custom" ? "Generating PowerPoint Deck..." : "✨ Generate Custom AI Presentation"}
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: themeColors.textPrimary }}>
              📊 Export System Insights Slides
            </h2>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", margin: "0 0 1.2rem 0", lineHeight: "1.4" }}>
              Generate a slide deck summarizing system analytics, expert directory, and gaps.
            </p>

            <button
              onClick={() => handleDownloadPPT("insights")}
              disabled={pptLoadingMode !== null}
              style={{
                ...buttonStyle,
                background: `linear-gradient(135deg, ${themeColors.accentPrimary} 0%, #7A5B0B 100%)`,
                opacity: pptLoadingMode !== null ? 0.6 : 1,
                cursor: pptLoadingMode !== null ? "not-allowed" : "pointer",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {pptLoadingMode === "insights" ? "Creating Insights PowerPoint..." : "📥 Download Insights Presentation"}
            </button>
          </div>

          {pptError && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "1rem", color: "#f87171", fontSize: "0.9rem" }}>
              <strong>Error:</strong> {pptError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
