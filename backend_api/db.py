import sqlite3
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "mindvault.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Teams table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    
    # Insert default teams
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('General')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('Engineering')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('HR Operations')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('Sales')")
    
    # 2. Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            team_id TEXT DEFAULT 'General',
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            department TEXT DEFAULT 'General',
            owner TEXT DEFAULT 'General'
        )
    """)
    
    # 3. Query Log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS query_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            confidence_score INTEGER,
            team_id TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 4. Meetings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            transcript TEXT,
            key_points TEXT,
            decisions TEXT,
            action_items TEXT,
            team_id TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 5. Workflow Rules table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            condition_type TEXT NOT NULL,
            condition_value TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_target TEXT,
            team_id TEXT DEFAULT 'General',
            is_active INTEGER DEFAULT 1
        )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM workflow_rules")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('Low Confidence Alert', 'confidence_below', '40', 'log_alert', '', 'General')
        """)
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('Critical Policy Notification', 'confidence_below', '60', 'notify_expert', 'Deepak Rao', 'General')
        """)
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('High Risk Layoff Flag', 'confidence_below', '50', 'flag_risk', 'Compliance Board', 'Engineering')
        """)
    
    # 6. Workflow Log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_id INTEGER,
            rule_name TEXT,
            query TEXT,
            answer TEXT,
            confidence_score INTEGER,
            action_executed TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 7. Onboarding progress table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS onboarding_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            item_id TEXT NOT NULL,
            viewed INTEGER DEFAULT 0,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role, item_id) ON CONFLICT REPLACE
        )
    """)

    # 8. Notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 9. Tasks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            deadline TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 10. Activity log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_type TEXT NOT NULL,
            description TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 11. Generated emails table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_type TEXT,
            recipient TEXT,
            subject TEXT,
            body TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 12. Generated reports table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT,
            title TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 13. Workflow instances table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow_instances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_name TEXT,
            current_step TEXT,
            status TEXT DEFAULT 'in_progress',
            steps_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 14. Customer Support Tickets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT,
            sentiment TEXT,
            priority TEXT,
            status TEXT DEFAULT 'open',
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 15. Employees table (drives team/manager routing and login identity)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            team_id TEXT NOT NULL DEFAULT 'General',
            manager_email TEXT,
            department TEXT DEFAULT 'General',
            badge TEXT DEFAULT '',
            avatar TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 16. Leave requests table - Employee submits, Manager reviews, HR gives final decision
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_email TEXT NOT NULL,
            employee_name TEXT NOT NULL,
            team_id TEXT NOT NULL DEFAULT 'General',
            manager_email TEXT,
            leave_type TEXT NOT NULL DEFAULT 'Casual Leave',
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT,
            status TEXT NOT NULL DEFAULT 'pending_manager',
            manager_comment TEXT,
            manager_decided_at TIMESTAMP,
            hr_comment TEXT,
            hr_decided_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Seed demo employees - two isolated teams, each with its own manager
    cursor.execute("SELECT COUNT(*) FROM employees")
    if cursor.fetchone()[0] == 0:
        demo_employees = [
            ("Gayathri Arra", "hr@mindvault.ai", "HR", "HR Operations", None, "Human Resources", "HR Manager", "\U0001F469\u200D\U0001F4BC"),
            ("David Miller", "manager@mindvault.ai", "Manager", "Engineering", None, "Operations", "Team Lead", "\U0001F468\u200D\U0001F4BC"),
            ("Sarah Jenkins", "employee@mindvault.ai", "Employee", "Engineering", "manager@mindvault.ai", "Customer Support", "Support Specialist", "\U0001F464"),
            ("Ananya Rao", "manager.sales@mindvault.ai", "Manager", "Sales", None, "Sales", "Team Lead", "\U0001F468\u200D\U0001F4BC"),
            ("Karan Verma", "employee.sales@mindvault.ai", "Employee", "Sales", "manager.sales@mindvault.ai", "Sales", "Sales Executive", "\U0001F464"),
        ]
        cursor.executemany("""
            INSERT INTO employees (name, email, role, team_id, manager_email, department, badge, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, demo_employees)

    # Insert default tasks
    cursor.execute("SELECT COUNT(*) FROM tasks")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO tasks (title, description, assigned_to, status, priority, deadline)
            VALUES ('Review Holiday Policy', 'Review the newly uploaded 2026 holiday guidelines and note changes.', 'General', 'pending', 'medium', '2026-07-20')
        """)
        cursor.execute("""
            INSERT INTO tasks (title, description, assigned_to, status, priority, deadline)
            VALUES ('Verify Engineering Guidelines', 'Check engineering compliance rules matches QA requirements.', 'Engineering', 'pending', 'high', '2026-07-15')
        """)
        cursor.execute("""
            INSERT INTO tasks (title, description, assigned_to, status, priority, deadline)
            VALUES ('Onboard Marketing Leads', 'Setup training plans for onboarding marketing agents.', 'HR Operations', 'pending', 'low', '2026-07-25')
        """)
    
    # Safe migrations
    try:
        cursor.execute("ALTER TABLE activity_log ADD COLUMN raw_query TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE activity_log ADD COLUMN team_id TEXT DEFAULT 'General'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN department TEXT DEFAULT 'General'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN owner TEXT DEFAULT 'General'")
    except sqlite3.OperationalError:
        pass
        
    conn.commit()
    conn.close()

# TEAMS HELPER FUNCTIONS
def get_all_teams():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM teams ORDER BY name ASC")
    teams = [{"name": row["name"]} for row in cursor.fetchall()]
    conn.close()
    return teams

def create_team(name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO teams (name) VALUES (?)", (name,))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

# DOCUMENTS METADATA HELPER FUNCTIONS
def set_document_metadata(filename, team_id, department="General", owner="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (filename, team_id, department, owner, upload_date) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
        ON CONFLICT(filename) DO UPDATE SET 
            team_id = excluded.team_id, 
            department = excluded.department, 
            owner = excluded.owner, 
            upload_date = CURRENT_TIMESTAMP
    """, (filename, team_id, department, owner))
    conn.commit()
    conn.close()

def set_document_team(filename, team_id):
    set_document_metadata(filename, team_id)

def get_document_team_map():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filename, team_id FROM documents")
    mapping = {row["filename"]: row["team_id"] for row in cursor.fetchall()}
    conn.close()
    return mapping

def get_all_documents_with_meta():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY upload_date DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def delete_document(filename):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE filename = ?", (filename,))
    conn.commit()
    conn.close()

# QUERY LOG HELPER FUNCTIONS
def log_query(query, confidence_score, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO query_log (query, confidence_score, team_id)
        VALUES (?, ?, ?)
    """, (query, confidence_score, team_id))
    conn.commit()
    conn.close()

def get_low_confidence_queries(limit=100):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT query, confidence_score, team_id, created_at 
        FROM query_log 
        WHERE confidence_score < 40
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# MEETINGS HELPER FUNCTIONS
def insert_meeting(filename, transcript, key_points, decisions, action_items, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO meetings (filename, transcript, key_points, decisions, action_items, team_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        filename, 
        transcript, 
        json.dumps(key_points), 
        json.dumps(decisions), 
        json.dumps(action_items), 
        team_id
    ))
    conn.commit()
    meeting_id = cursor.lastrowid
    conn.close()
    return meeting_id

def get_all_meetings(team_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if team_id:
        cursor.execute("SELECT * FROM meetings WHERE team_id = ? ORDER BY created_at DESC", (team_id,))
    else:
        cursor.execute("SELECT * FROM meetings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    meetings = []
    for r in rows:
        m = dict(r)
        try:
            m["key_points"] = json.loads(m["key_points"])
        except Exception:
            m["key_points"] = []
        try:
            m["decisions"] = json.loads(m["decisions"])
        except Exception:
            m["decisions"] = []
        try:
            m["action_items"] = json.loads(m["action_items"])
        except Exception:
            m["action_items"] = []
        meetings.append(m)
    return meetings

# WORKFLOWS HELPER FUNCTIONS
def get_all_workflow_rules(team_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if team_id:
        cursor.execute("SELECT * FROM workflow_rules WHERE team_id = ? AND is_active = 1")
    else:
        cursor.execute("SELECT * FROM workflow_rules WHERE is_active = 1")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_workflow_rule(name, condition_type, condition_value, action_type, action_target, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (name, condition_type, condition_value, action_type, action_target, team_id))
    conn.commit()
    rule_id = cursor.lastrowid
    conn.close()
    return rule_id

def remove_workflow_rule(rule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workflow_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()

def log_workflow_execution(rule_id, rule_name, query, answer, confidence_score, action_executed, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow_log (rule_id, rule_name, query, answer, confidence_score, action_executed, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (rule_id, rule_name, query, answer, confidence_score, action_executed, status))
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    return log_id

def get_all_workflow_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workflow_log ORDER BY created_at DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_workflow_log(log_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE workflow_log SET status = ? WHERE id = ?", (status, log_id))
    conn.commit()
    conn.close()

# ONBOARDING HELPER FUNCTIONS
def log_onboarding_progress(role, item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO onboarding_progress (role, item_id, viewed)
        VALUES (?, ?, 1)
        ON CONFLICT(role, item_id) DO UPDATE SET viewed = 1, viewed_at = CURRENT_TIMESTAMP
    """, (role, item_id))
    conn.commit()
    conn.close()

def get_onboarding_completed_items(role):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT item_id FROM onboarding_progress WHERE role = ? AND viewed = 1", (role,))
    completed = [row["item_id"] for row in cursor.fetchall()]
    conn.close()
    return completed

# NOTIFICATIONS DB HELPERS
def add_notification(title, content, type_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notifications (title, content, type)
        VALUES (?, ?, ?)
    """, (title, content, type_str))
    conn.commit()
    notif_id = cursor.lastrowid
    conn.close()
    return notif_id

def get_notifications(limit=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_notification_read(notif_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET status = 'read' WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()

# TASKS DB HELPERS
def add_task(title, description, assigned_to, priority="medium", deadline=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, assigned_to, priority, deadline)
        VALUES (?, ?, ?, ?, ?)
    """, (title, description, assigned_to, priority, deadline))
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return task_id

def get_tasks(assigned_to=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if assigned_to:
        cursor.execute("SELECT * FROM tasks WHERE assigned_to = ? ORDER BY deadline ASC, created_at DESC", (assigned_to,))
    else:
        cursor.execute("SELECT * FROM tasks ORDER BY deadline ASC, created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_task(task_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
    conn.commit()
    conn.close()

# ACTIVITY LOG DB HELPERS
def add_activity(activity_type, description, details=None, raw_query=None, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO activity_log (activity_type, description, details, raw_query, team_id)
        VALUES (?, ?, ?, ?, ?)
    """, (activity_type, description, details, raw_query, team_id))
    conn.commit()
    activity_id = cursor.lastrowid
    conn.close()
    return activity_id

def get_user_query_history(team_id: str, limit: int = 10) -> list[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT raw_query, created_at 
            FROM activity_log 
            WHERE team_id = ? AND raw_query IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT ?
        """, (team_id, limit))
        rows = cursor.fetchall()
        return [{"query": row["raw_query"], "timestamp": row["created_at"]} for row in rows]
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()

def get_activities(limit=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# GENERATED EMAILS DB HELPERS
def save_email(template_type, recipient, subject, body):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO generated_emails (template_type, recipient, subject, body)
        VALUES (?, ?, ?, ?)
    """, (template_type, recipient, subject, body))
    conn.commit()
    email_id = cursor.lastrowid
    conn.close()
    return email_id

def get_emails(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generated_emails ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# GENERATED REPORTS DB HELPERS
def save_report(report_type, title, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO generated_reports (report_type, title, content)
        VALUES (?, ?, ?)
    """, (report_type, title, content))
    conn.commit()
    report_id = cursor.lastrowid
    conn.close()
    return report_id

def get_reports(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generated_reports ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# WORKFLOW INSTANCES DB HELPERS
def create_workflow_instance(template_name, current_step, status, steps_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow_instances (template_name, current_step, status, steps_data)
        VALUES (?, ?, ?, ?)
    """, (template_name, current_step, status, json.dumps(steps_data)))
    conn.commit()
    instance_id = cursor.lastrowid
    conn.close()
    return instance_id

def get_workflow_instances():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workflow_instances ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    instances = []
    for r in rows:
        item = dict(r)
        try:
            item["steps_data"] = json.loads(item["steps_data"])
        except Exception:
            item["steps_data"] = []
        instances.append(item)
    return instances

def update_workflow_instance(instance_id, current_step, status, steps_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE workflow_instances 
        SET current_step = ?, status = ?, steps_data = ? 
        WHERE id = ?
    """, (current_step, status, json.dumps(steps_data), instance_id))
    conn.commit()
    conn.close()

# SUPPORT TICKETS HELPERS
def create_support_ticket(query, answer, category, sentiment, priority, summary):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO support_tickets (query, answer, category, sentiment, priority, summary)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (query, answer, category, sentiment, priority, summary))
    conn.commit()
    ticket_id = cursor.lastrowid
    conn.close()
    return ticket_id

def get_all_support_tickets(limit=100):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def update_support_ticket_status(ticket_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE support_tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
    conn.close()

# EMPLOYEES / TEAM DIRECTORY HELPERS
def get_employee_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees WHERE lower(email) = lower(?)", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_employees(team_id=None, role=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM employees WHERE 1=1"
    params = []
    if team_id:
        query += " AND team_id = ?"
        params.append(team_id)
    if role:
        query += " AND role = ?"
        params.append(role)
    query += " ORDER BY role ASC, name ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_manager_for_team(team_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees WHERE team_id = ? AND role = 'Manager' LIMIT 1", (team_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_employee(name, email, role, team_id, manager_email=None, department="General", badge="", avatar=""):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO employees (name, email, role, team_id, manager_email, department, badge, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, email, role, team_id, manager_email, department, badge, avatar))
        conn.commit()
        emp_id = cursor.lastrowid
        success = True
    except sqlite3.IntegrityError:
        emp_id = None
        success = False
    conn.close()
    return {"success": success, "id": emp_id}

# LEAVE REQUEST HELPERS (Employee -> Manager -> HR workflow)
def create_leave_request(employee_email, employee_name, team_id, manager_email, leave_type, start_date, end_date, reason):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO leave_requests
            (employee_email, employee_name, team_id, manager_email, leave_type, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_manager')
    """, (employee_email, employee_name, team_id, manager_email, leave_type, start_date, end_date, reason))
    conn.commit()
    request_id = cursor.lastrowid
    conn.close()
    return request_id

def get_leave_request(request_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leave_requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_leave_requests_for_employee(employee_email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM leave_requests WHERE lower(employee_email) = lower(?) ORDER BY created_at DESC
    """, (employee_email,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_leave_requests_for_manager(manager_email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM leave_requests WHERE lower(manager_email) = lower(?) ORDER BY created_at DESC
    """, (manager_email,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_leave_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leave_requests ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def manager_decide_leave(request_id, decision, comment, manager_email):
    """decision: 'approve' -> pending_hr, 'reject' -> rejected_manager"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT manager_email, status FROM leave_requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": "not_found"}
    if row["manager_email"] and row["manager_email"].lower() != manager_email.lower():
        conn.close()
        return {"success": False, "error": "forbidden"}
    if row["status"] != "pending_manager":
        conn.close()
        return {"success": False, "error": "already_decided"}

    new_status = "pending_hr" if decision == "approve" else "rejected_manager"
    cursor.execute("""
        UPDATE leave_requests
        SET status = ?, manager_comment = ?, manager_decided_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, comment, request_id))
    conn.commit()
    conn.close()
    return {"success": True, "status": new_status}

def hr_decide_leave(request_id, decision, comment):
    """decision: 'approve' -> approved, 'reject' -> rejected_hr. Only valid once manager has approved."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM leave_requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": "not_found"}
    if row["status"] != "pending_hr":
        conn.close()
        return {"success": False, "error": "not_ready_for_hr"}

    new_status = "approved" if decision == "approve" else "rejected_hr"
    cursor.execute("""
        UPDATE leave_requests
        SET status = ?, hr_comment = ?, hr_decided_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, comment, request_id))
    conn.commit()
    conn.close()
    return {"success": True, "status": new_status}
