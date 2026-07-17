import json
import traceback
import sys
from groq import Groq
from utils.encoding_helper import sanitize_to_ascii

class Reasoner:
    def __init__(self, api_key, model_name="llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model_name = model_name
        
    def generate_answer(self, query, retrieved_docs):
        """
        Calls Groq to generate a calibrated answer based on the retrieved context docs.
        Returns a dict with 'answer', 'confidence_score', and 'reasoning'.
        """
        if not self.api_key:
            return {
                "answer": "Groq API Key is not configured. Please set the GROQ_API_KEY.",
                "confidence_score": 0,
                "reasoning": "No API key configured to execute reasoning."
            }
            
        # Format the context
        context_str = ""
        for i, doc in enumerate(retrieved_docs):
            context_str += f"Source [{i+1}]: {doc['source']} (Relevance Score: {doc['score']:.2f})\nContent:\n{doc['text']}\n\n"
            
        system_prompt = (
            "You are an expert HR Assistant reasoning layer for MindVault AI. Your job is to answer the user query based ONLY on the provided context snippets.\n"
            "You must also determine a calibrated confidence score (0-100) and the reasoning behind it.\n\n"
            "Strict Calibration Rules:\n"
            "- 80-100: Multiple context sources clearly agree on the facts and answer the query.\n"
            "- 40-79: Only one source matches, or sources are ambiguous/contradictory (for example: a 2023 policy vs a 2025 update for new hires).\n"
            "- 0-39: No good match is found in the context.\n\n"
            "Important Rules:\n"
            "1. If no good match is found in the context (confidence score 0-39), the answer MUST state that the information was not found, and you must NOT guess or use outside knowledge.\n"
            "2. If there are contradictions (e.g. 2023 vs 2025 remote work rules), highlight the contradiction clearly and mark the confidence score between 40 and 79.\n"
            "3. You MUST respond with a JSON object. The JSON structure should have these exact keys:\n"
            "   - 'confidence_score': (integer between 0 and 100)\n"
            "   - 'reasoning': 'A detailed explanation of why the confidence score was chosen based on the sources.'\n"
            "   - 'answer': 'Your calibrated answer based strictly on the context. If confidence_score is below 40, set this to: \"I'm sorry, but the requested information could not be found in the indexed documents.\"' \n"
        )
        
        user_prompt = f"""
User Query: {query}

Context Chunks:
{context_str}

Please generate the JSON response.
"""

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        try:
            client = Groq(api_key=self.api_key)
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model_name,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            result_json = json.loads(response.choices[0].message.content)
            
            # Extract fields with safe fallbacks
            score = int(result_json.get("confidence_score", 0))
            reasoning = result_json.get("reasoning", "No explanation provided.")
            answer = result_json.get("answer", "No answer provided.")
            
            # Programmatic calibration override to ensure no guessing when confidence is low
            if score < 40:
                answer = "I'm sorry, but the requested information could not be found in the indexed documents."
                score = min(score, 39)  # Keep score below 40
                
            return {
                "answer": answer,
                "confidence_score": score,
                "reasoning": reasoning
            }
            
        except Exception as e:
            traceback.print_exc(file=sys.stderr)
            return {
                "answer": f"Error running reasoning model: {str(e)}",
                "confidence_score": 0,
                "reasoning": f"Reasoning failed due to an exception: {traceback.format_exc()}"
            }
