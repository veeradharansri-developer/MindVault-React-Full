import sys
import os

# Ensure the parent directory is in path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import db
from agents.orchestrator import Orchestrator
from services.notifications import get_all_notifications, create_notification, mark_as_read
from services.memory import get_ai_memory

def run_tests():
    print("==================================================")
    print("STARTING AUTONOMOUS COPILOT BACKEND TESTS")
    print("==================================================")

    # 1. Database Init & Table Verification
    print("[1] Initializing Database & Verifying Schema...")
    db.init_db()
    
    # Try inserting a mock notification
    notif_id = db.add_notification("Test Alert", "Verification test description", "system")
    assert notif_id is not None, "Failed to insert notification in database"
    print(f"[OK] Database Schema verified. Notification created with ID: {notif_id}")

    # 2. Notification Service Tests
    print("\n[2] Testing Notification Service...")
    notifs = get_all_notifications()
    assert len(notifs) > 0, "No notifications found in database"
    notif = notifs[0]
    assert notif["title"] == "Test Alert", "Incorrect notification retrieved"
    mark_as_read(notif["id"])
    print("[OK] Notification Service operational.")

    # 3. AI Memory Service Tests
    print("\n[3] Testing AI Memory Aggregation Service...")
    db.add_activity("test_event", "Admin executed verification script")
    memory = get_ai_memory()
    assert "recent_chats" in memory, "Missing query log cache"
    assert "recent_documents" in memory, "Missing documents list cache"
    assert "recent_emails" in memory, "Missing email memory list"
    print("[OK] AI Memory state compiled successfully.")

    # 4. Orchestrator Initialization Tests
    print("\n[4] Testing AI Agent Grid & Orchestrator...")
    orchestrator = Orchestrator(
        data_dir=os.path.join(os.path.dirname(__file__), "data"),
        hr_docs_dir=os.path.join(os.path.dirname(__file__), "hr_docs")
    )
    
    assert orchestrator.knowledge_agent is not None, "Failed to load KnowledgeAgent"
    assert orchestrator.email_agent is not None, "Failed to load EmailAgent"
    assert orchestrator.meeting_agent is not None, "Failed to load MeetingAgent"
    assert orchestrator.report_agent is not None, "Failed to load ReportAgent"
    assert orchestrator.workflow_agent is not None, "Failed to load WorkflowAgent"
    assert orchestrator.risk_agent is not None, "Failed to load RiskAgent"
    print("[OK] AI Multi-Agent Grid initialized successfully.")

    print("\n==================================================")
    print("VERIFICATION COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
