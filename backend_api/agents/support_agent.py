import os
import json
from retriever import Retriever
from groq import Groq
from utils.encoding_helper import sanitize_to_ascii
import db
import ingest

class SupportAgent:
    def __init__(self, support_docs_dir: str, support_data_dir: str):
        self.support_docs_dir = support_docs_dir
        self.support_data_dir = support_data_dir
        
        os.makedirs(self.support_data_dir, exist_ok=True)
        
        embeddings_path = os.path.join(self.support_data_dir, "embeddings.npy")
        metadata_path = os.path.join(self.support_data_dir, "metadata.pkl")
        
        if not os.path.exists(embeddings_path) or not os.path.exists(metadata_path):
            print("Support index files missing. Generating vector index for support docs...")
            ingest.run_ingestion(hr_docs_dir=self.support_docs_dir, output_dir=self.support_data_dir)
            
        self.retriever = Retriever(data_dir=self.support_data_dir)

    def handle_query(self, query: str, api_key: str) -> dict:
        """
        Classifies support intent, sentiment, priority, generates replies,
        auto-creates database tickets and escalates unresolved queries.
        """
        if not api_key:
            return {
                "answer": "Please configure your Groq API key.",
                "category": "general",
                "intent": "FAQs",
                "sentiment": "neutral",
                "priority": "medium",
                "confidence_score": 0,
                "escalate": True,
                "sources": [],
                "ticket_id": None
            }

        # 1. RAG-retrieve support docs
        sources = []
        context_chunks = []
        try:
            results = self.retriever.retrieve(query, top_k=3)
            for r in results:
                context_chunks.append(f"Source: {r['source']}\nContent: {r['text']}")
                sources.append(r['source'])
        except Exception as e:
            print(f"SupportAgent retrieval failed: {e}")
            
        context_str = "\n---\n".join(context_chunks) if context_chunks else "No relevant customer support documentation found."

        # 2. setup prompts for Groq
        system_prompt = (
            "You are an expert AI Customer Support Agent for MindVault.\n"
            "Review the customer query, consult the retrieved context below, and provide a helpful, accurate, customer-facing response.\n"
            "You MUST respond with a JSON object containing these exact keys:\n"
            "{\n"
            "  \"answer\": \"your friendly, professional, customer-facing response\",\n"
            "  \"category\": \"billing\" | \"technical\" | \"general\" | \"urgent\",\n"
            "  \"intent\": \"FAQs\" | \"Billing\" | \"Refunds\" | \"Shipping\" | \"Returns\" | \"Technical Issues\" | \"Password Reset\" | \"Complaint Handling\",\n"
            "  \"sentiment\": \"positive\" | \"neutral\" | \"negative\" | \"frustrated\",\n"
            "  \"priority\": \"low\" | \"medium\" | \"high\" | \"critical\",\n"
            "  \"confidence_score\": 0-100 integer representing confidence based on the context,\n"
            "  \"summary\": \"a brief 1-sentence summary of the ticket inquiry\"\n"
            "}\n"
            "Formatting & Tone guidelines:\n"
            "- Tone must be helpful, professional, and friendly.\n"
            "- If the context does not contain the answer, set confidence_score to less than 40 and explain politely that we don't have that information.\n"
            "- Assign 'priority': 'critical' for high frustration or system outages, 'high' for billing errors, 'medium' for general questions, 'low' for FAQs."
        )

        user_prompt = f"""
        Customer Query: {query}
        
        Retrieved Reference Context:
        {context_str}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            res_data = json.loads(response.choices[0].message.content)
            answer = res_data.get("answer", "I apologize, but I am unable to answer your request at the moment.")
            category = res_data.get("category", "general")
            intent = res_data.get("intent", "FAQs")
            sentiment = res_data.get("sentiment", "neutral")
            priority = res_data.get("priority", "medium")
            confidence = int(res_data.get("confidence_score", 50))
            summary = res_data.get("summary", "Inquiry regarding " + intent)
        except Exception as e:
            print(f"SupportAgent generation failed: {e}")
            answer = "I apologize, but I am having trouble processing your query. Please try again later."
            category = "general"
            intent = "FAQs"
            sentiment = "neutral"
            priority = "medium"
            confidence = 20
            summary = "Failed to parse customer support query details."

        # Escalation criteria
        escalate = confidence < 40 or category == "urgent" or priority in ["high", "critical"] or sentiment in ["negative", "frustrated"]
        status = "escalated" if escalate else "resolved"

        # Create support ticket in database
        ticket_id = None
        try:
            ticket_id = db.create_support_ticket(
                query=query,
                answer=answer,
                category=category,
                sentiment=sentiment,
                priority=priority,
                summary=summary
            )
            # Update status to match escalation
            db.update_support_ticket_status(ticket_id, status)
            
            # Log activity and add notification
            db.add_activity("support_ticket", f"Created ticket {ticket_id} [{status.upper()}]: '{summary}'", f"Priority: {priority}")
            if escalate:
                db.add_notification("Ticket Escalated", f"Support Ticket #{ticket_id} ({priority.upper()} priority) requires attention: {summary}", "urgent")
        except Exception as e:
            print(f"Error saving support ticket to database: {e}")

        return {
            "answer": answer,
            "category": category,
            "intent": intent,
            "sentiment": sentiment,
            "priority": priority,
            "confidence_score": confidence,
            "escalate": escalate,
            "sources": list(set(sources)),
            "snippets": results,
            "summary": summary,
            "ticket_id": ticket_id,
            "status": status
        }
