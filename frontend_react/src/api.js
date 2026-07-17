import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export async function askMindVault(query, apiKey, teamId = "General") {
  const response = await axios.post(`${API_BASE_URL}/api/ask`, {
    query,
    api_key: apiKey || null,
    team_id: teamId || "General"
  });
  return response.data;
}

export async function checkRisk(situation, apiKey, threshold = 0.4) {
  const response = await axios.post(`${API_BASE_URL}/api/risk-check`, {
    situation,
    api_key: apiKey || null,
    threshold,
  });
  return response.data;
}

export async function getInsights() {
  const response = await axios.get(`${API_BASE_URL}/api/insights`);
  return response.data;
}

export async function checkHealth() {
  const response = await axios.get(`${API_BASE_URL}/api/health`);
  return response.data;
}

export async function uploadDoc(file, teamId = "General") {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE_URL}/api/upload-doc?team_id=${encodeURIComponent(teamId)}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function notifyExpert(expertName, context) {
  const response = await axios.post(`${API_BASE_URL}/api/notify-expert`, {
    expert_name: expertName,
    context: context || null,
  });
  return response.data;
}

export async function generatePPT(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-ppt`, payload, {
    responseType: "blob",
  });
  return response.data;
}

export async function listDocuments() {
  const response = await axios.get(`${API_BASE_URL}/api/documents`);
  return response.data;
}

export async function deleteDocument(filename) {
  const response = await axios.delete(`${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}`);
  return response.data;
}

// ==========================================
// ADDITIVE METHODS FOR THE 5 NEW FEATURES
// ==========================================

// 1. Multi-team endpoints
export async function getTeams() {
  const response = await axios.get(`${API_BASE_URL}/api/teams`);
  return response.data;
}

export async function createTeam(name) {
  const response = await axios.post(`${API_BASE_URL}/api/teams`, { name });
  return response.data;
}

export async function assignDocumentTeam(filename, teamId) {
  const response = await axios.post(`${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}/team`, {
    team_id: teamId
  });
  return response.data;
}

// 2. Workflows endpoints
export async function getWorkflowRules() {
  const response = await axios.get(`${API_BASE_URL}/api/workflows/rules`);
  return response.data;
}

export async function createWorkflowRule(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/workflows/rules`, payload);
  return response.data;
}

export async function deleteWorkflowRule(ruleId) {
  const response = await axios.delete(`${API_BASE_URL}/api/workflows/rules/${ruleId}`);
  return response.data;
}

export async function getWorkflowLogs() {
  const response = await axios.get(`${API_BASE_URL}/api/workflows/log`);
  return response.data;
}

export async function approveWorkflowLog(logId) {
  const response = await axios.post(`${API_BASE_URL}/api/workflows/log/${logId}/approve`);
  return response.data;
}

// 3. Gap Reports endpoints
export async function getGapReports(apiKey) {
  const response = await axios.get(`${API_BASE_URL}/api/reports/gaps`, {
    params: { api_key: apiKey || null }
  });
  return response.data;
}

// 4. Onboarding suggestions endpoints
export async function getOnboardingSuggestions(role, apiKey) {
  const response = await axios.get(`${API_BASE_URL}/api/onboarding/suggestions`, {
    params: { role, api_key: apiKey || null }
  });
  return response.data;
}

export async function logOnboardingProgress(role, itemId) {
  const response = await axios.post(`${API_BASE_URL}/api/onboarding/progress`, {
    role,
    item_id: itemId
  });
  return response.data;
}

export async function getOnboardingProgress(role) {
  const response = await axios.get(`${API_BASE_URL}/api/onboarding/progress`, {
    params: { role }
  });
  return response.data;
}

// 5. Meetings transcribe
export async function transcribeMeeting(file, teamId = "General", apiKey) {
  const formData = new FormData();
  formData.append("file", file);

  let url = `${API_BASE_URL}/api/meetings/transcribe?team_id=${encodeURIComponent(teamId)}`;
  if (apiKey) {
    url += `&api_key=${encodeURIComponent(apiKey)}`;
  }

  const response = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function listMeetings(teamId = null) {
  const params = {};
  if (teamId) params.team_id = teamId;
  const response = await axios.get(`${API_BASE_URL}/api/meetings`, { params });
  return response.data;
}

// 6. Copilot New APIs
export async function generateEmail(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-email`, payload);
  return response.data;
}

export async function generateReport(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-report`, payload);
  return response.data;
}

export async function generateQuotation(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-quotation`, payload, {
    responseType: "blob"
  });
  return response.data;
}

export async function generateInvoice(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-invoice`, payload, {
    responseType: "blob"
  });
  return response.data;
}

export async function generateQuestionPaper(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-question-paper`, payload);
  return response.data;
}

export async function getDashboard(assignedTo = null) {
  const params = {};
  if (assignedTo) params.assigned_to = assignedTo;
  const response = await axios.get(`${API_BASE_URL}/api/dashboard`, { params });
  return response.data;
}

export async function getAnalytics() {
  const response = await axios.get(`${API_BASE_URL}/api/analytics`);
  return response.data;
}

export async function getActivity() {
  const response = await axios.get(`${API_BASE_URL}/api/activity`);
  return response.data;
}

export async function getNotifications() {
  const response = await axios.get(`${API_BASE_URL}/api/notifications`);
  return response.data;
}

export async function markNotificationRead(notifId) {
  const response = await axios.post(`${API_BASE_URL}/api/notifications/${notifId}/read`);
  return response.data;
}

export async function getRecommendations(query, answer, apiKey, teamId = "General") {
  const response = await axios.post(`${API_BASE_URL}/api/recommendations`, {
    query,
    answer,
    api_key: apiKey || null,
    team_id: teamId || "General"
  });
  return response.data;
}

export async function createTask(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/tasks`, payload);
  return response.data;
}

export async function updateTaskStatus(taskId, status) {
  const response = await axios.post(`${API_BASE_URL}/api/tasks/${taskId}/status`, { status });
  return response.data;
}

export async function logActivity(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/activity`, payload);
  return response.data;
}

// ==========================================
// EMPLOYEE DIRECTORY + LEAVE WORKFLOW (Employee -> Manager -> HR)
// ==========================================
export async function getEmployees(teamId = null, role = null) {
  const params = {};
  if (teamId) params.team_id = teamId;
  if (role) params.role = role;
  const response = await axios.get(`${API_BASE_URL}/api/employees`, { params });
  return response.data;
}

export async function getEmployeeProfile(email) {
  const response = await axios.get(`${API_BASE_URL}/api/employees/${encodeURIComponent(email)}`);
  return response.data;
}

export async function createEmployee(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/employees`, payload);
  return response.data;
}

export async function submitLeaveRequest(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/leave`, payload);
  return response.data;
}

export async function getLeaveRequests(role, email) {
  const response = await axios.get(`${API_BASE_URL}/api/leave`, { params: { role, email } });
  return response.data;
}

export async function managerDecideLeave(requestId, decision, comment, actorEmail) {
  const response = await axios.post(`${API_BASE_URL}/api/leave/${requestId}/manager-decision`, {
    decision,
    comment,
    actor_email: actorEmail
  });
  return response.data;
}

export async function hrDecideLeave(requestId, decision, comment, actorEmail) {
  const response = await axios.post(`${API_BASE_URL}/api/leave/${requestId}/hr-decision`, {
    decision,
    comment,
    actor_email: actorEmail
  });
  return response.data;
}
