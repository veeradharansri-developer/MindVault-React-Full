import json
import os
from groq import Groq
from agents.knowledge_agent import KnowledgeAgent
from agents.meeting_agent import MeetingAgent
from agents.email_agent import EmailAgent
from agents.report_agent import ReportAgent
from agents.workflow_agent import WorkflowAgent
from agents.risk_agent import RiskAgent
from agents.recommendation_agent import RecommendationAgent
from agents.support_agent import SupportAgent
from utils.encoding_helper import sanitize_to_ascii

class Orchestrator:
    def __init__(self, data_dir, hr_docs_dir, support_docs_dir=None, support_data_dir=None):
        self.data_dir = data_dir
        self.hr_docs_dir = hr_docs_dir
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if support_docs_dir is None:
            support_docs_dir = os.path.join(base_dir, "support_docs")
        if support_data_dir is None:
            support_data_dir = os.path.join(base_dir, "support_data")
            
        self.support_docs_dir = support_docs_dir
        self.support_data_dir = support_data_dir
        
        self.knowledge_agent = KnowledgeAgent(data_dir, hr_docs_dir)
        self.meeting_agent = MeetingAgent(hr_docs_dir)
        self.email_agent = EmailAgent()
        self.report_agent = ReportAgent()
        self.workflow_agent = WorkflowAgent()
        self.risk_agent = RiskAgent(hr_docs_dir)
        self.recommendation_agent = RecommendationAgent()
        self.support_agent = SupportAgent(support_docs_dir, support_data_dir)

    def route_and_execute(self, query: str, api_key: str, team_id: str = "General") -> dict:
        """
        Orchestrates request, chooses appropriate agent(s), executes them and compiles the result.
        """
        if not api_key:
            # Fallback to knowledge agent which handles empty API keys gracefully
            return self.knowledge_agent.answer_query(query, api_key, team_id)

        # 1. Classify the user query
        classification_prompt = (
            "You are the central router for MindVault AI, an Autonomous Employee Copilot system.\n"
            "Analyze the user's input request and determine: "
            "(1) The primary intent type (one of: 'knowledge', 'email', 'report', 'meeting', 'workflow', 'risk', 'support', 'coordinated').\n"
            "Choose 'support' for customer-facing questions about billing, accounts, refunds, shipping, tracking, or product troubleshooting issues (as opposed to 'knowledge' which is for internal employee/HR questions).\n"
            "(2) If 'coordinated', list the steps to execute (e.g. ['knowledge', 'email'] for 'find holiday policy and write an email about it').\n"
            "(3) Any extracted parameters (e.g., 'template_type', 'recipient', 'tone', 'report_type', 'situation', 'workflow_template').\n"
            "Return a JSON object with these exact keys:\n"
            "{\n"
            "  \"intent\": \"knowledge\" | \"email\" | \"report\" | \"meeting\" | \"workflow\" | \"risk\" | \"support\" | \"coordinated\",\n"
            "  \"steps\": [\"step1\", \"step2\", ...],\n"
            "  \"params\": {\n"
            "     \"template_type\": \"...\",\n"
            "     \"recipient\": \"...\",\n"
            "     \"tone\": \"...\",\n"
            "     \"report_type\": \"...\",\n"
            "     \"situation\": \"...\",\n"
            "     \"workflow_template\": \"...\"\n"
            "  }\n"
            "}"
        )

        classification_prompt = sanitize_to_ascii(classification_prompt)
        sanitized_query = sanitize_to_ascii(query)

        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": classification_prompt},
                    {"role": "user", "content": f"User Request: {sanitized_query}"}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            classification = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Orchestrator classification failed: {e}")
            classification = {"intent": "knowledge", "steps": [], "params": {}}

        intent = classification.get("intent", "knowledge")
        params = classification.get("params", {})

        # 2. Execute appropriate agent
        if intent == "knowledge":
            res = self.knowledge_agent.answer_query(query, api_key, team_id)
            res["agent"] = "Knowledge Agent"
            return res

        elif intent == "email":
            template = params.get("template_type") or "General Inquiry"
            recipient = params.get("recipient") or "HR Department"
            tone = params.get("tone") or "Professional"
            res = self.email_agent.generate_email(template, recipient, tone, query, api_key)
            return {
                "answer": f"**Subject:** {res.get('subject')}\n\n{res.get('body')}",
                "confidence_score": 100,
                "reasoning": "Email Agent successfully generated professional corporate copy.",
                "sources": [],
                "experts": [],
                "agent": "Email Agent"
            }

        elif intent == "report":
            report_type = params.get("report_type") or "General Business Report"
            res = self.report_agent.generate_report(report_type, f"Automated {report_type}", query, api_key)
            return {
                "answer": res.get("content", ""),
                "confidence_score": 100,
                "reasoning": "Report Agent compiled data into standard markdown format.",
                "sources": [],
                "experts": [],
                "agent": "Report Agent"
            }

        elif intent == "meeting":
            # For direct transcript text summarize
            summary = self.meeting_agent.summarize_transcript(query, api_key)
            key_points = summary.get("key_points", [])
            decisions = summary.get("decisions", [])
            action_items = summary.get("action_items", [])
            ans = f"### Meeting Summary\n"
            ans += "**Key Discussion Points:**\n" + "\n".join([f"- {kp}" for kp in key_points]) + "\n\n"
            ans += "**Critical Decisions:**\n" + "\n".join([f"- {d}" for d in decisions]) + "\n\n"
            ans += "**Action Items:**\n" + "\n".join([f"- {ai}" for ai in action_items])
            return {
                "answer": ans,
                "confidence_score": 100,
                "reasoning": "Meeting Agent structured raw chat text into Minute notes.",
                "sources": [],
                "experts": [],
                "agent": "Meeting Agent"
            }

        elif intent == "workflow":
            wf_template = params.get("workflow_template") or "General Approval Request"
            res = self.workflow_agent.start_workflow(wf_template, {"description": query}, api_key)
            ans = f"### Workflow Triggered Successfully!\n"
            ans += f"**Instance ID:** {res.get('instance_id')}\n"
            ans += f"**Status:** {res.get('status')}\n"
            ans += f"**Current Step:** {res.get('current_step')}\n"
            ans += f"**Action Log:** {res.get('message')}"
            return {
                "answer": ans,
                "confidence_score": 100,
                "reasoning": "Workflow Agent initialized multi-step approval automation state.",
                "sources": [],
                "experts": [],
                "agent": "Workflow Agent"
            }

        elif intent == "risk":
            situation = params.get("situation") or query
            res = self.risk_agent.analyze_risk(situation, api_key)
            ans = f"### Risk Analysis Findings\n"
            ans += f"**Similarity Score:** {res.get('similarity', 0.0)*100:.1f}%\n"
            ans += f"**Matched policy:** {res.get('matched_filename') or 'None'}\n\n"
            ans += f"**Mitigation Plan:**\n{res.get('summary')}"
            return {
                "answer": ans,
                "confidence_score": int(res.get("similarity", 0.0) * 100),
                "reasoning": "Risk Agent evaluated compliance index matching.",
                "sources": [res.get("matched_filename")] if res.get("matched_filename") else [],
                "experts": [],
                "agent": "Risk Agent"
            }

        elif intent == "support":
            res = self.support_agent.handle_query(query, api_key)
            return {
                "answer": res.get("answer", ""),
                "confidence_score": res.get("confidence_score", 100),
                "reasoning": f"Support Agent answered query. Category: {res.get('category')}. Escalated: {res.get('escalate')}",
                "sources": res.get("sources", []),
                "experts": [],
                "agent": "Support Agent",
                "category": res.get("category", "general"),
                "escalate": res.get("escalate", False)
            }

        elif intent == "coordinated":
            steps = classification.get("steps", [])
            coordinated_result = ""
            current_context = query
            sources = []
            experts = []
            
            # Step A: Check Knowledge
            if "knowledge" in steps:
                k_res = self.knowledge_agent.answer_query(query, api_key, team_id)
                coordinated_result += f"### Knowledge Base Context:\n{k_res['answer']}\n\n"
                current_context = k_res["answer"]
                sources.extend(k_res["sources"])
                experts.extend(k_res["experts"])

            # Step B: Generate Email (if email follows knowledge)
            if "email" in steps:
                template = params.get("template_type") or "Policy Update Inquiry"
                recipient = params.get("recipient") or "Team Lead"
                tone = params.get("tone") or "Professional"
                email_res = self.email_agent.generate_email(template, recipient, tone, current_context, api_key)
                coordinated_result += f"### Generated Draft Draft:\n"
                coordinated_result += f"**Subject:** {email_res.get('subject')}\n\n{email_res.get('body')}\n\n"

            # Step C: Generate Report
            if "report" in steps:
                report_type = params.get("report_type") or "Analysis Summary"
                rep_res = self.report_agent.generate_report(report_type, f"Coordinated {report_type}", current_context, api_key)
                coordinated_result += f"### Generated Report:\n{rep_res.get('content')}\n\n"

            return {
                "answer": coordinated_result.strip(),
                "confidence_score": 100,
                "reasoning": "Orchestrator coordinated execution across multiple sub-agents.",
                "sources": list(set(sources)),
                "experts": list(set(experts)),
                "agent": f"Coordinated Agent Router (Steps: {', '.join(steps)})"
            }

        # Catch all fallback
        res = self.knowledge_agent.answer_query(query, api_key, team_id)
        res["agent"] = "Knowledge Agent (Fallback)"
        return res
