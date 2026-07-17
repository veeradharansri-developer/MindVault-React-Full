import os
import numpy as np
from groq import Groq
from utils.encoding_helper import sanitize_to_ascii


def get_document_similarity(situation, hr_docs_dir, model):
    """
    Embeds the situation text and compares it against each FULL document
    (not chunks) in hr_docs_dir using cosine similarity. Returns the best
    matching document's filename, content, and similarity score.
    """
    if not os.path.exists(hr_docs_dir):
        return {"similarity": 0.0, "filename": None, "content": ""}

    situation_vec = model.encode(situation)
    situation_norm = np.linalg.norm(situation_vec)
    if situation_norm == 0:
        return {"similarity": 0.0, "filename": None, "content": ""}
    situation_vec = situation_vec / situation_norm

    best_score = -1.0
    best_filename = None
    best_content = ""

    for filename in os.listdir(hr_docs_dir):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(hr_docs_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            continue

        doc_vec = model.encode(content)
        doc_norm = np.linalg.norm(doc_vec)
        if doc_norm == 0:
            continue
        doc_vec = doc_vec / doc_norm

        score = float(np.dot(situation_vec, doc_vec))
        if score > best_score:
            best_score = score
            best_filename = filename
            best_content = content

    return {
        "similarity": max(best_score, 0.0),
        "filename": best_filename,
        "content": best_content,
    }


def generate_risk_summary(client: Groq, model_name, situation, matched_filename, matched_content):
    """
    Calls Groq to summarize what happened in a similar past situation and
    what risks to watch out for this time.
    """
    system_prompt = (
        "You are an HR risk analyst. Given a new situation and a similar past "
        "document, summarize in plain language: (1) what happened in the past "
        "situation, (2) what risks or issues arose, and (3) what the HR team "
        "should watch out for this time. Keep it concise, structured, and "
        "practical. Do not invent facts not present in the past document."
    )
    user_prompt = f"""
New situation being planned:
{situation}

Most similar past document ({matched_filename}):
{matched_content}

Provide your risk analysis and recommendations.
"""
    system_prompt = sanitize_to_ascii(system_prompt)
    user_prompt = sanitize_to_ascii(user_prompt)

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model_name,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating risk summary: {str(e)}"
