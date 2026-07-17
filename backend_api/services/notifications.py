import db

def create_notification(title: str, content: str, notif_type: str) -> int:
    """
    Creates a new system notification and saves it to the SQLite database.
    """
    return db.add_notification(title, content, notif_type)

def get_all_notifications(limit: int = 50) -> list:
    """
    Retrieves the list of recent notifications from the database.
    """
    return db.get_notifications(limit)

def mark_as_read(notif_id: int):
    """
    Marks a pending notification as read.
    """
    db.mark_notification_read(notif_id)
