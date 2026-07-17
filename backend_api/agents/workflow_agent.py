from services.workflow_executor import WorkflowExecutor
import db

class WorkflowAgent:
    def __init__(self):
        self.executor = WorkflowExecutor()

    def start_workflow(self, template_name: str, input_data: dict, api_key: str) -> dict:
        """
        Starts an autonomous multi-step workflow.
        """
        result = self.executor.start(template_name, input_data, api_key)
        
        # Log activity
        db.add_activity("workflow_started", f"Started workflow template '{template_name}'", f"Instance ID: {result.get('instance_id')}")
        db.add_notification("Workflow Executing", f"A new '{template_name}' workflow is currently active.", "workflow")
        
        return result

    def approve_step(self, instance_id: int, approver: str, api_key: str) -> dict:
        """
        Approves the pending step of an active workflow.
        """
        result = self.executor.approve(instance_id, approver, api_key)
        
        # Log activity
        db.add_activity("workflow_approved", f"Approved step in workflow instance {instance_id} by {approver}", f"Instance status: {result.get('status')}")
        db.add_notification("Workflow Approved", f"Workflow instance {instance_id} was approved by {approver}.", "workflow")
        
        return result

    def reject_step(self, instance_id: int, rejecter: str, reason: str, api_key: str) -> dict:
        """
        Rejects/Terminates an active workflow.
        """
        result = self.executor.reject(instance_id, rejecter, reason, api_key)
        
        # Log activity
        db.add_activity("workflow_rejected", f"Rejected workflow instance {instance_id} by {rejecter}. Reason: {reason}", f"Instance status: {result.get('status')}")
        db.add_notification("Workflow Rejected", f"Workflow instance {instance_id} was rejected by {rejecter}.", "workflow")
        
        return result
