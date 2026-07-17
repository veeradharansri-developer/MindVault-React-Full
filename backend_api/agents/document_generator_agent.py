from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class DocumentGeneratorAgent:
    def __init__(self):
        pass

    def generate_email(self, template_type: str, recipient: str, tone: str, details: str, api_key: str) -> dict:
        if not api_key:
            return {
                "subject": "Missing API Key",
                "body": "Please configure your Groq API key.",
                "status": "error"
            }

        system_prompt = (
            "You are an expert corporate communications copywriter. "
            "Your job is to generate a professional, polished email based on the template type, recipient, tone, and specific details provided.\n"
            "Format the email clearly, starting with a suitable Subject line on the first line (prefixed with 'Subject: '), "
            "followed by a blank line and the full email body (including salutation, body paragraphs, and professional sign-off).\n"
            "Keep the content appropriate for the chosen tone and recipient."
        )

        user_prompt = f"""
        Template Type: {template_type}
        Recipient: {recipient}
        Tone: {tone}
        Key details and instructions:
        {details}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )

        raw_content = response.choices[0].message.content.strip()

        # Parse Subject and Body
        subject = f"Email: {template_type}"
        body = raw_content

        lines = raw_content.split("\n")
        if lines[0].lower().startswith("subject:"):
            subject = lines[0][len("subject:"):].strip()
            body = "\n".join(lines[2:]).strip() if len(lines) > 2 else "\n".join(lines[1:]).strip()

        # Save email into SQLite database
        try:
            email_id = db.save_email(template_type, recipient, subject, body)
            db.add_activity("email_generation", f"Generated email using template '{template_type}' for '{recipient}'", f"Email ID: {email_id}")
            db.add_notification("Email Generated", f"A new email copy is ready for '{recipient}' with theme '{template_type}'.", "email")
        except Exception as e:
            print(f"EmailAgent DB logging failed: {e}")

        return {
            "subject": subject,
            "body": body,
            "status": "success"
        }

    def generate_report(self, report_type: str, title: str, details: str, api_key: str) -> dict:
        if not api_key:
            return {
                "title": "Missing API Key",
                "content": "Please configure your Groq API key.",
                "status": "error"
            }

        system_prompt = (
            "You are a professional business analyst. Your task is to generate a comprehensive, highly-structured business report based on the provided report type, report title, and raw details/updates.\n"
            "Format the report using clean Markdown layout with clear headers (##, ###), bullet points, and tables where applicable to represent performance, highlights, lowlights, and action items.\n"
            "Ensure the report content is detailed, structured, and ready to be printed or exported."
        )

        user_prompt = f"""
        Report Type: {report_type}
        Report Title: {title}
        Raw Notes/Details to include:
        {details}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )

        content = response.choices[0].message.content.strip()

        # Save report into SQLite database
        try:
            report_id = db.save_report(report_type, title, content)
            db.add_activity("report_generation", f"Generated report '{title}' of type '{report_type}'", f"Report ID: {report_id}")
            db.add_notification("Report Generated", f"A new '{report_type}' is ready for review.", "report")
        except Exception as e:
            print(f"ReportAgent DB logging failed: {e}")

        return {
            "title": title,
            "content": content,
            "status": "success"
        }

    def generate_question_paper(self, topic: str, difficulty: str, num_questions: int, api_key: str) -> dict:
        if not api_key:
            return {
                "title": "Missing API Key",
                "content": "Please configure your Groq API key.",
                "status": "error"
            }

        system_prompt = (
            "You are an expert academic examiner and content generator. Your task is to generate a comprehensive, highly-structured question paper based on the topic, difficulty level, and number of questions requested.\n"
            "Format the output using clean Markdown layout with clear headers (##, ###). "
            "You must include:\n"
            "1. A title header block showing the Topic, Difficulty, and Total Marks.\n"
            "2. Numbered questions with clear marks allocation (e.g., [5 Marks]) for each.\n"
            "3. An Answer Key or marking scheme section at the very end of the document.\n"
            "Ensure the questions match the specified difficulty level (Easy, Medium, Hard)."
        )

        user_prompt = f"""
        Topic: {topic}
        Difficulty Level: {difficulty}
        Number of Questions: {num_questions}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )

        content = response.choices[0].message.content.strip()
        title = f"Question Paper - {topic} ({difficulty})"

        # Save report into SQLite database
        try:
            report_id = db.save_report("Question Paper", title, content)
            db.add_activity("report_generation", f"Generated question paper '{title}'", f"Report ID: {report_id}")
            db.add_notification("Question Paper Generated", f"A new question paper on '{topic}' is ready.", "report")
        except Exception as e:
            print(f"ReportAgent DB logging failed: {e}")

        return {
            "title": title,
            "content": content,
            "status": "success"
        }
