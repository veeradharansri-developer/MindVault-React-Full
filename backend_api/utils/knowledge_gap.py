from datetime import datetime


def log_knowledge_gap(gap_list, query):
    """
    Appends a (query, timestamp) record to the given list.
    gap_list is passed in by the caller so it can be a shared in-memory
    store (module-level list in the FastAPI app, or Streamlit session_state).
    """
    gap_list.append({
        "query": query,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    })
