import { useState, useEffect } from "react";
import axios from "axios";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { FileText, Search, Download, Eye, FileDown } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function DocumentsPage({ defaultCategory }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (defaultCategory) {
      setActiveCategory(defaultCategory);
    } else {
      setActiveCategory("All");
    }
  }, [defaultCategory]);
  
  // Custom mock list representing the corporate archive of completed document assets
  const generatedDocs = [
    {
      id: "doc-1",
      title: "Offer Letter - Rahul Sharma.txt",
      category: "Offer Letters",
      created_at: "July 17, 2026",
      owner: "HR Team",
      content: `MINDVAULT ENTERPRISES LTD.\n-------------------------\nDate: July 17, 2026\n\nTo,\nRahul Sharma,\n\nSubject: Offer of Employment - Senior Software Engineer\n\nDear Rahul,\n\nWe are pleased to offer you the position of Senior Software Engineer. Your Annual Cost to Company (CTC) will be ₹24,0,000 (Twenty-Four Lakhs INR). Your joining date is confirmed as August 1, 2026.\n\nBest Regards,\nHR Team\nMindVault AI`
    },
    {
      id: "doc-2",
      title: "Onboarding SOP - Sarah Jenkins.txt",
      category: "Policies",
      created_at: "July 17, 2026",
      owner: "Support Manager",
      content: `ONBOARDING CHECKLIST: Sarah Jenkins\n-----------------------------------\nRole: Support Specialist\nDepartment: Customer Support\n\n[✓] IT Asset Allocation (Laptop & Security Key)\n[ ] HR Orientation Session Scheduled\n[ ] Database Access Provisioning\n[ ] Slack and email credentials generated`
    },
    {
      id: "doc-3",
      title: "Leave Approval Notification.txt",
      category: "Policies",
      created_at: "July 16, 2026",
      owner: "HR Admin",
      content: `LEAVE APPROVAL FORM\n-------------------\nEmployee: Priya Patel\nRequested: 5 Days (Annual Leave)\nStart Date: July 20, 2026\n\nStatus: Approved automatically by MindVault AI engine.`
    },
    {
      id: "doc-4",
      title: "HR Executive Q3 Report.txt",
      category: "Reports",
      created_at: "July 15, 2026",
      owner: "System Compiler",
      content: `MINDVAULT Q3 HR ANALYSIS REPORT\n-------------------------------\nCompiled on: July 17, 2026\n\nKey Highlights:\n- New Hires this month: 4\n- Workflows triggered: 142 (95% automated)\n- Onboarding compliance rating: 98%\n- Projected headcount increase: 12% Q-o-Q.`
    },
    {
      id: "doc-5",
      title: "Q3 Engineering Meeting Minutes.txt",
      category: "Meeting Minutes",
      created_at: "July 14, 2026",
      owner: "System Scribe",
      content: `MEETING MINUTES: Q3 Engineering Alignment\n---------------------------------------\nDate: July 17, 2026\n\nDecisions Made:\n1. Transition repository to unified Tailwind configuration.\n2. Scale local LLM reasoning limits to 4k tokens.\n\nAction Items:\n- Dev Team: Deploy vector search indexes (Deadline: July 25)`
    },
    {
      id: "doc-6",
      title: "Invoice #MV-2026-089.txt",
      category: "Invoices",
      created_at: "July 13, 2026",
      owner: "Accounts System",
      content: `INVOICE TO ACME CORP\n--------------------\nInvoice No: MV-2026-089\nDate: July 17, 2026\n\nItem Description: AI Orchestration Consulting Services\nHours: 10\nRate: 1,500 INR / hour\nTotal Due: 15,000 INR`
    }
  ];

  const categories = ["All", "Offer Letters", "Reports", "Invoices", "Meeting Minutes", "Policies"];

  const filteredDocs = generatedDocs.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", doc.title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Left Column: Archives & Search */}
      <div style={{ flex: "1.5 1 600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Search & Category Filter */}
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search generated archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "2.5rem" }}
              />
              <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: themeColors.textSecondary }} />
            </div>
          </div>

          {/* Categories Horizontal Selector */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: isActive ? themeColors.accentPrimary : "#1E1E1E",
                    border: `1px solid ${themeColors.borderDivider}`,
                    color: isActive ? "#121212" : themeColors.textSecondary,
                    borderRadius: "10px",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Grid / Table */}
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Document Title</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Category</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Generated Date</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Owner</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: themeColors.textSecondary, fontStyle: "italic" }}>
                      No matching documents found in archive.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: `1px solid ${themeColors.borderDivider}`,
                        transition: "background 0.2s",
                      }}
                    >
                      <td style={{ padding: "1rem", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FileText size={16} style={{ color: themeColors.accentPrimary }} />
                          {doc.title}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={pillStyle}>{doc.category}</span>
                      </td>
                      <td style={{ padding: "1rem", color: themeColors.textSecondary }}>{doc.created_at}</td>
                      <td style={{ padding: "1rem", color: themeColors.textSecondary }}>{doc.owner}</td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: themeColors.accentPrimary
                            }}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => downloadDoc(doc)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: themeColors.textSecondary
                            }}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Preview Inspector */}
      <div style={{ flex: "1 1 380px" }}>
        {selectedDoc ? (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
                Document Preview
              </h4>
              <button
                onClick={() => downloadDoc(selectedDoc)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: themeColors.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.75rem",
                  fontWeight: 600
                }}
              >
                <FileDown size={14} />
                Download
              </button>
            </div>
            
            <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginBottom: "1rem" }}>
              Title: <strong>{selectedDoc.title}</strong><br/>
              Category: <strong>{selectedDoc.category}</strong>
            </div>

            <div style={{
              background: "#1E1E1E",
              border: `1px solid ${themeColors.borderDivider}`,
              borderRadius: "12px",
              padding: "1.25rem",
              fontSize: "0.85rem",
              color: themeColors.textPrimary,
              fontFamily: typography.mono.fontFamily,
              whiteSpace: "pre-wrap",
              maxHeight: "450px",
              overflowY: "auto",
              lineHeight: 1.6
            }}>
              {selectedDoc.content}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed" }}>
            <FileText size={42} style={{ color: "#CBD5E1", margin: "0 auto 1rem" }} />
            <h4 style={{ ...typography.heading, fontSize: "1rem", margin: 0, color: themeColors.textSecondary }}>
              Document Inspector
            </h4>
            <p style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Select a document from the left list to view its contents and content structure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
