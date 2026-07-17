import os
import json
import tempfile
from datetime import datetime
from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class MeetingAgent:
    def __init__(self, hr_docs_dir=None):
        self.hr_docs_dir = hr_docs_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "hr_docs")

    def transcribe_audio(self, file_bytes, filename: str, api_key: str) -> str:
        if not api_key:
            raise ValueError("No Groq API key provided for transcription.")

        suffix = os.path.splitext(filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(file_bytes)
            temp_audio_path = temp_audio.name

        try:
            client = Groq(api_key=api_key)
            with open(temp_audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(filename, audio_file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json"
                )
            return transcription.text
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    def summarize_transcript(self, transcript: str, api_key: str) -> dict:
        if not api_key:
            raise ValueError("No Groq API key provided.")

        structuring_prompt = (
            "You are an expert secretary. Given the raw transcript of a meeting, extract:\n"
            "1. Key discussion points (list of strings).\n"
            "2. Critical decisions made (list of strings).\n"
            "3. Action items with assignments (list of strings). Formatted as: '[Action Item] - Assigned to: [Name] - Deadline: [YYYY-MM-DD or TBD] - Priority: [High/Medium/Low]'\n"
            "Return a JSON object with these exact keys:\n"
            "{\n"
            "  \"key_points\": [\"point 1\", ...],\n"
            "  \"decisions\": [\"decision 1\", ...],\n"
            "  \"action_items\": [\"action 1\", ...]\n"
            "}\n"
            "Keep it professional and concise."
        )

        client = Groq(api_key=api_key)
        structuring_prompt = sanitize_to_ascii(structuring_prompt)
        transcript = sanitize_to_ascii(transcript)

        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": structuring_prompt},
                {"role": "user", "content": f"Transcript:\n{transcript}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        structured_data = json.loads(response.choices[0].message.content)
        return structured_data

    def process_meeting(self, file_bytes, filename: str, team_id: str, api_key: str) -> dict:
        transcript = self.transcribe_audio(file_bytes, filename, api_key)
        summary_data = self.summarize_transcript(transcript, api_key)
        
        key_points = summary_data.get("key_points", [])
        decisions = summary_data.get("decisions", [])
        action_items = summary_data.get("action_items", [])

        # Log into database
        meeting_id = db.insert_meeting(
            filename=filename,
            transcript=transcript,
            key_points=key_points,
            decisions=decisions,
            action_items=action_items,
            team_id=team_id
        )

        # Log activity
        db.add_activity("meeting_summary", f"Summarized meeting transcription: {filename}", f"Meeting ID: {meeting_id}")
        db.add_notification("Meeting Summary Generated", f"Structured minutes of meeting and action items are ready for '{filename}'.", "meeting")

        # Also write a text document notes file so it gets indexable (matches existing code behavior)
        notes_filename = f"meeting_notes_{meeting_id}_{filename.split('.')[0]}.txt"
        notes_content = (
            f"Meeting notes for: {filename}\n"
            f"Team context: {team_id}\n"
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"Key Points:\n" + "\n".join([f"- {p}" for p in key_points]) + "\n\n"
            f"Decisions:\n" + "\n".join([f"- {d}" for d in decisions]) + "\n\n"
            f"Action Items:\n" + "\n".join([f"- {a}" for a in action_items]) + "\n\n"
            f"Full Transcript:\n{transcript}\n"
        )
        
        os.makedirs(self.hr_docs_dir, exist_ok=True)
        notes_filepath = os.path.join(self.hr_docs_dir, notes_filename)
        with open(notes_filepath, "w", encoding="utf-8") as f:
            f.write(notes_content)

        # Populate tasks based on action items (optional automation step)
        for item in action_items:
            try:
                # Basic parsing, e.g. "Review API - Assigned to: Deepak Rao - Deadline: 2026-07-20 - Priority: High"
                parts = item.split(" - Assigned to: ")
                task_title = parts[0].strip()
                assigned = "General"
                priority = "medium"
                deadline = None
                if len(parts) > 1:
                    subparts = parts[1].split(" - Deadline: ")
                    assigned = subparts[0].strip()
                    if len(subparts) > 1:
                        subparts2 = subparts[1].split(" - Priority: ")
                        deadline = subparts2[0].strip()
                        if deadline.upper() == "TBD":
                            deadline = None
                        if len(subparts2) > 1:
                            priority = subparts2[1].strip().lower()
                
                db.add_task(
                    title=f"MOM Task: {task_title}",
                    description=f"Action item from meeting '{filename}' assigned to {assigned}.",
                    assigned_to=assigned,
                    priority=priority,
                    deadline=deadline
                )
            except Exception as e:
                print(f"Error parsing task from action item: {e}")

        return {
            "meeting_id": meeting_id,
            "filename": notes_filename,
            "key_points": key_points,
            "decisions": decisions,
            "action_items": action_items,
            "transcript": transcript
        }
