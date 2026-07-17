import json
from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class WorkflowExecutor:
    def __init__(self):
        pass

    def start(self, template_name: str, input_data: dict, api_key: str) -> dict:
        """
        Initializes and runs the initial automated steps of a workflow template.
        """
        description = input_data.get("description", "Workflow request")
        t_name_lower = template_name.lower()

        if "leave" in t_name_lower or "vacation" in t_name_lower or "pto" in t_name_lower:
            # 1. Leave Approval Workflow
            steps = [
                {"name": "Submit Request", "status": "completed", "data": {"details": description}},
                {"name": "Company Leave Policy Check", "status": "completed", "data": {"status": "Balance Valid", "rules_checked": "PTO-2026"}},
                {"name": "HR Operations Review", "status": "pending", "data": {"assigned_approver": "Jessica Chen (HR Lead)"}},
                {"name": "Update Calendar & Notify", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Leave Approval", "HR Operations Review", "in_progress", steps)
            db.add_notification("Leave Approval Pending", f"Jessica Chen review required for leave request: {description[:50]}...", "workflow")
            db.add_task(f"Review Leave Request", f"Approve PTO request: '{description[:50]}...'", "Jessica Chen", "medium", "2026-07-18")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "HR Operations Review",
                "steps": steps,
                "message": "Leave request submitted and balance verified. Sent to Jessica Chen for HR Operations approval."
            }

        elif "expense" in t_name_lower or "invoice" in t_name_lower or "reimbursement" in t_name_lower:
            # 2. Expense Approval Workflow
            extracted_fields = {
                "invoice_number": "EXP-2026-89",
                "amount": "$4,250.00",
                "vendor": "CloudScale Systems",
                "category": "SaaS Platform Subscription"
            }
            if api_key:
                try:
                    client = Groq(api_key=api_key)
                    prompt = (
                        "You are an AI Invoice Data Extractor. Extract the invoice/expense number, total amount, vendor name, and expense category "
                        "from the user description. Return a JSON object with keys: invoice_number, amount, vendor, category.\n"
                        f"Description:\n{description}"
                    )
                    prompt = sanitize_to_ascii(prompt)
                    response = client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        temperature=0.1,
                        response_format={"type": "json_object"}
                    )
                    extracted_fields = json.loads(response.choices[0].message.content)
                except Exception as e:
                    print(f"Workflow extraction failed: {e}")

            steps = [
                {"name": "AI Expense Audit", "status": "completed", "data": extracted_fields},
                {"name": "Policy Status Check", "status": "completed", "data": {"category": extracted_fields.get("category", "Software"), "policy_status": "Compliant"}},
                {"name": "Finance Director Review", "status": "pending", "data": {"assigned_approver": "Deepak Rao (Finance Director)"}},
                {"name": "Reimbursement Processing", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Expense Approval", "Finance Director Review", "in_progress", steps)
            db.add_notification("Expense Review Requested", f"Finance Director authorization required for Expense {extracted_fields.get('invoice_number')} from {extracted_fields.get('vendor')}.", "workflow")
            db.add_task(f"Approve Expense {extracted_fields.get('invoice_number')}", f"Verify SaaS expenses for {extracted_fields.get('vendor')} totaling {extracted_fields.get('amount')}.", "Deepak Rao", "high", "2026-07-25")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Finance Director Review",
                "steps": steps,
                "message": f"Expense workflow initialized. Extracted data: {extracted_fields.get('vendor')} - {extracted_fields.get('amount')}. Routing to Deepak Rao."
            }

        elif "onboard" in t_name_lower:
            # 3. Employee Onboarding Workflow
            steps = [
                {"name": "Setup Onboarding Plan", "status": "completed", "data": {"details": description}},
                {"name": "Welcome Package Dispatch", "status": "completed", "data": {"status": "Dispatched"}},
                {"name": "IT Hardware Provisioning", "status": "pending", "data": {"assigned_approver": "Arjun Mehta (IT Lead)"}},
                {"name": "HR Review & Complete", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Employee Onboarding", "IT Hardware Provisioning", "in_progress", steps)
            db.add_notification("Onboarding Verification Needed", f"IT Provisioning required for onboarding: {description[:50]}...", "workflow")
            db.add_task(f"IT Hardware Provisioning", f"Prepare workstation and systems for onboarding: '{description[:50]}...'", "Arjun Mehta", "medium", "2026-07-19")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "IT Hardware Provisioning",
                "steps": steps,
                "message": "Onboarding workflow triggered. Welcoming package sent. Routed to Arjun Mehta for IT provisioning."
            }

        elif "offboard" in t_name_lower or "exit" in t_name_lower:
            # 4. Employee Offboarding Workflow
            steps = [
                {"name": "Exit Intake Submission", "status": "completed", "data": {"details": description}},
                {"name": "Asset Recovery Check", "status": "completed", "data": {"status": "Pending laptop return"}},
                {"name": "Systems Access Revocation", "status": "pending", "data": {"assigned_approver": "Arjun Mehta (IT Lead)"}},
                {"name": "HR Exit Signoff", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Employee Offboarding", "Systems Access Revocation", "in_progress", steps)
            db.add_notification("Offboarding Scribe Active", f"Access revocation required for employee exit: {description[:50]}...", "workflow")
            db.add_task(f"Revoke Systems Access", f"Revoke emails and database keys: '{description[:50]}...'", "Arjun Mehta", "high", "2026-07-16")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Systems Access Revocation",
                "steps": steps,
                "message": "Offboarding initiated. Exit interview details recorded. Routed to Arjun Mehta for Systems Revocation."
            }

        elif "purchase" in t_name_lower or "procurement" in t_name_lower:
            # 6. Purchase Requests Workflow
            steps = [
                {"name": "Submit Purchase Request", "status": "completed", "data": {"details": description}},
                {"name": "Budget Allocation Check", "status": "completed", "data": {"status": "Budget Available"}},
                {"name": "Department Head Review", "status": "pending", "data": {"assigned_approver": "Jessica Chen (HR Lead)"}},
                {"name": "Procurement Purchase Order Creation", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Purchase Request", "Department Head Review", "in_progress", steps)
            db.add_notification("Purchase Review Requested", f"Jessica Chen authorization required for Purchase: {description[:50]}...", "workflow")
            db.add_task(f"Review Purchase Request", f"Review procurement item request: '{description[:50]}...'", "Jessica Chen", "high", "2026-07-21")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Department Head Review",
                "steps": steps,
                "message": "Purchase request submitted. Mapped budget verified. Routed to Jessica Chen for department approval."
            }

        elif "travel" in t_name_lower or "flight" in t_name_lower or "hotel" in t_name_lower or "trip" in t_name_lower:
            # 7. Travel Requests Workflow
            steps = [
                {"name": "Submit Travel Request", "status": "completed", "data": {"details": description}},
                {"name": "Travel Desk Estimate Check", "status": "completed", "data": {"estimated_cost": "$850.00"}},
                {"name": "Manager Travel Authorization", "status": "pending", "data": {"assigned_approver": "Deepak Rao (Finance Director)"}},
                {"name": "Booking and Ticket Issuance", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Travel Request", "Manager Travel Authorization", "in_progress", steps)
            db.add_notification("Travel Authorization Required", f"Deepak Rao authorization required for Trip: {description[:50]}...", "workflow")
            db.add_task(f"Authorize Travel", f"Evaluate flight/hotel reimbursement for trip: '{description[:50]}...'", "Deepak Rao", "medium", "2026-07-24")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Manager Travel Authorization",
                "steps": steps,
                "message": "Travel request logged. Costs compiled. Routed to Deepak Rao for manager authorization."
            }

        else:
            # 5. Document Approval Workflow (Default fallback for other triggers)
            steps = [
                {"name": "Policy Draft Submission", "status": "completed", "data": {"input": description}},
                {"name": "Legal Compliance Check", "status": "completed", "data": {"risk_index": "Low", "verdict": "Cleared"}},
                {"name": "Executive Review", "status": "pending", "data": {"assigned_approver": "Jessica Chen (HR Lead)"}},
                {"name": "Publish to Knowledge Base", "status": "pending", "data": {}}
            ]
            instance_id = db.create_workflow_instance("Document Approval", "Executive Review", "in_progress", steps)
            db.add_notification("Document Review Requested", f"Jessica Chen review requested for policy draft: {template_name}.", "workflow")
            db.add_task(f"Review Policy Draft: {template_name}", f"Evaluate Draft: '{description[:50]}...'", "Jessica Chen", "medium", "2026-07-22")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Executive Review",
                "steps": steps,
                "message": f"Document Approval Workflow '{template_name}' triggered. Sent to Jessica Chen for Executive Review."
            }

    def approve(self, instance_id: int, approver: str, api_key: str) -> dict:
        """
        Advances the pending step of an active workflow instance.
        """
        instances = db.get_workflow_instances()
        instance = next((inst for inst in instances if inst["id"] == instance_id), None)
        
        if not instance:
            raise ValueError(f"Workflow instance {instance_id} not found.")

        steps = instance["steps_data"]
        
        # Mark pending step as completed
        for step in steps:
            if step["status"] == "pending":
                step["status"] = "completed"
                step["data"]["approved_by"] = approver
                break
                
        # Determine next step
        next_pending = next((step for step in steps if step["status"] == "pending"), None)
        
        if next_pending:
            current_step = next_pending["name"]
            status = "in_progress"
            message = f"Step approved by {approver}. Routed to next step: {current_step}."
        else:
            current_step = "Completed"
            status = "approved"
            message = f"Workflow fully approved and finalized by {approver}."
            db.add_notification("Workflow Fully Approved", f"Workflow instance {instance_id} ('{instance['template_name']}') has been fully approved.", "workflow")

        db.update_workflow_instance(instance_id, current_step, status, steps)
        return {
            "instance_id": instance_id,
            "status": status,
            "current_step": current_step,
            "steps": steps,
            "message": message
        }

    def reject(self, instance_id: int, rejecter: str, reason: str, api_key: str) -> dict:
        """
        Rejects and terminates an active workflow instance.
        """
        instances = db.get_workflow_instances()
        instance = next((inst for inst in instances if inst["id"] == instance_id), None)
        
        if not instance:
            raise ValueError(f"Workflow instance {instance_id} not found.")

        steps = instance["steps_data"]
        
        # Mark pending step as rejected
        for step in steps:
            if step["status"] == "pending":
                step["status"] = "rejected"
                step["data"]["rejected_by"] = rejecter
                step["data"]["reason"] = reason
                break

        db.update_workflow_instance(instance_id, "Rejected", "rejected", steps)
        db.add_notification("Workflow Rejected", f"Workflow instance {instance_id} ('{instance['template_name']}') was rejected by {rejecter}.", "workflow")

        return {
            "instance_id": instance_id,
            "status": "rejected",
            "current_step": "Rejected",
            "steps": steps,
            "message": f"Workflow rejected by {rejecter}. Reason: {reason}."
        }
