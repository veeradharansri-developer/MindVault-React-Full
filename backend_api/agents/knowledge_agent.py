import os
from retriever import Retriever
from reasoning import Reasoner
from experts import get_experts_for_sources
import db

class KnowledgeAgent:
    def __init__(self, data_dir, hr_docs_dir):
        self.data_dir = data_dir
        self.hr_docs_dir = hr_docs_dir
        self.retriever = Retriever(data_dir=data_dir)

    def answer_query(self, query: str, api_key: str, team_id: str = "General"):
        if not api_key:
            return {
                "answer": "No Groq API key provided.",
                "confidence_score": 0,
                "reasoning": "Missing API key.",
                "sources": [],
                "experts": []
            }

        # Multi-team RAG filtering
        allowed_sources = None
        if team_id and team_id != "General":
            doc_mapping = db.get_document_team_map()
            allowed_sources = [fn for fn, t in doc_mapping.items() if t == team_id]

        matched_chunks = self.retriever.retrieve(query, top_k=4, allowed_sources=allowed_sources)
        if not matched_chunks:
            return {
                "answer": "I'm sorry, but no indexed documents were found matching this team context.",
                "confidence_score": 10,
                "reasoning": "RAG retriever returned no matched document chunks.",
                "sources": [],
                "experts": []
            }

        reasoner = Reasoner(api_key=api_key)
        result = reasoner.generate_answer(query, matched_chunks)

        sources = [c["source"] for c in matched_chunks]
        experts = get_experts_for_sources(sources, hr_docs_dir=self.hr_docs_dir)

        # Log query database metrics
        try:
            db.log_query(query, result.get("confidence_score", 0), team_id)
        except Exception as e:
            print(f"KnowledgeAgent DB logging failed: {e}")

        return {
            "answer": result.get("answer", ""),
            "confidence_score": result.get("confidence_score", 0),
            "reasoning": result.get("reasoning", ""),
            "sources": sources,
            "experts": experts
        }
