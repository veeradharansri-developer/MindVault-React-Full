import db

def get_ai_memory() -> dict:
    """
    Gathers and aggregates corporate AI interactions for system memory context.
    """
    # 1. Fetch recent queries
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    recent_chats = []
    try:
        cursor.execute("SELECT query, confidence_score, created_at FROM query_log ORDER BY created_at DESC LIMIT 10")
        recent_chats = [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        print(f"Memory get_chats failed: {e}")

    # 2. Fetch recent documents
    recent_docs = []
    try:
        cursor.execute("SELECT filename, team_id FROM documents ORDER BY id DESC LIMIT 10")
        recent_docs = [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        print(f"Memory get_docs failed: {e}")

    conn.close()

    # 3. Fetch recent emails
    recent_emails = []
    try:
        recent_emails = db.get_emails(10)
    except Exception as e:
        print(f"Memory get_emails failed: {e}")

    # 4. Fetch recent reports
    recent_reports = []
    try:
        recent_reports = db.get_reports(10)
    except Exception as e:
        print(f"Memory get_reports failed: {e}")

    # 5. Fetch recent meetings
    recent_meetings = []
    try:
        recent_meetings = db.get_all_meetings()[:10]
    except Exception as e:
        print(f"Memory get_meetings failed: {e}")

    # 6. Fetch recent workflows
    recent_workflows = []
    try:
        recent_workflows = db.get_workflow_instances()[:10]
    except Exception as e:
        print(f"Memory get_workflows failed: {e}")

    return {
        "recent_chats": recent_chats,
        "recent_documents": recent_docs,
        "recent_emails": recent_emails,
        "recent_reports": recent_reports,
        "recent_meetings": recent_meetings,
        "recent_workflows": recent_workflows
    }
