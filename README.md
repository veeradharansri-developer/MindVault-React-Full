# MindVault AI - HR & Customer Support Agentic Copilot

MindVault AI is an agentic copilot designed for corporate operations, internal employee workflows, compliance checks, and customer support. It is built using FastAPI (backend) and React + Vite (frontend) and orchestrates 8 intelligent agents powered by Groq and sentence embeddings.

---

## Core Features

### 1. Central Multi-Agent Orchestrator
Routes queries dynamically using LLM intent classification to the most relevant expert agent:
* **Knowledge Agent**: Answers internal corporate queries using RAG embeddings.
* **Meeting Agent**: Processes audio meeting transcripts, summarizing key points and action items.
* **Email Agent**: Generates professional email drafts in various corporate tones.
* **Report Agent**: Compiles comprehensive status briefs, project logs, and question papers.
* **Workflow Agent**: Initializes multi-step task approvals and action logs.
* **Risk Agent**: Computes compliance checks against historical layoff and migration reports.
* **Recommendation Agent**: Formulates context-relevant next actions and follow-ups.
* **Customer Support Agent**: New agent servicing customer-facing queries with dynamic escalation.

---

## Brand-New Features Added

### 1. History-Aware Personalization Engine
Factor in the user's actual query history to produce tailored next-step recommendations rather than looking only at a single query:
* Safe SQLite database migrations added `raw_query` and `team_id` tracking columns to `activity_log`.
* Personalization history aggregator retrieves the last 10 queries.
* Recommendation prompts analyze query histories to personalize suggestion outcomes based on actual session activities.

### 2. Premium Document Generation
Generate official corporate and academic documents in standard `.docx` file formats or markdown previews:
* **Quotations**: Input client name, terms, and custom line items. Download structured DOCX files containing subtotal, 18% GST calculation, grand total, and a formatted terms footer.
* **Invoices**: Input invoice numbers, client names, line items, and due dates. Downloads structured invoice templates in Word document (.docx) format with default "Unpaid" status.
* **Question Papers**: Input topics, difficulty levels (Easy, Medium, Hard), and the number of questions. AI compiles numbered questions, marks allocations, and an answer key/marking scheme at the end.

### 3. Customer Support Agent (Full Stack)
Instantly resolve customer questions using a dedicated support pipeline:
* **Support Docs KB**: Seeded with plain-text documentation in `backend_api/support_docs/` (`refund_policy.txt`, `shipping_faq.txt`, `billing_faq.txt`, `account_troubleshooting.txt`).
* **Isolated Vector Retrieval**: Instantiates a secondary independent Retriever pointing to a dedicated support database index (`support_data/`) constructed automatically on startup without interfering with HR indices.
* **AI Support Agent**: Classifies queries into categories (`billing`, `technical`, `general`, `urgent`) and responds in a friendly, conversational customer support tone.
* **Escalation Logic**: Sets `escalate=True` for urgent categories or low-confidence RAG retrieval.
* **Frontend UI Tab**: Modeled on AskTab, displaying color-coded category badges and alert banners indicating when human agent intervention may be required.

---

## Running the Project

Refer to [SETUP_INSTRUCTIONS.md](file:///c:/Users/arrag/Downloads/MindVault_React_Full%20ready/MindVault_React_Full/MindVault_React_Full/SETUP_INSTRUCTIONS.md) to start the FastAPI backend server on port 8000 and the Vite dev server on port 5173.
