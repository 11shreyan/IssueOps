import "./style.css";

const app = document.querySelector("#app");
const API_BASE_URL = "http://127.0.0.1:8000";
const SESSION_KEY = "issueops-session";

const categoryDepartmentMap = {
  Electrical: "Electrical Department",
  Plumbing: "Plumbing Department",
  IT: "IT Support",
  Sanitation: "Sanitation Department",
  General: "Campus Operations",
};

const suggestedStatuses = ["Reported", "Acknowledged", "In Progress", "Resolved"];

const state = {
  issues: [],
  loading: false,
  submitting: false,
  statusUpdating: false,
  error: "",
  selectedIssueId: null,
  auth: loadSession(),
};

function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session) {
  state.auth = session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  state.auth = null;
  localStorage.removeItem(SESSION_KEY);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function detectCategory(description) {
  const text = description.toLowerCase();

  if (["light", "fan", "power", "switch"].some((word) => text.includes(word))) {
    return "Electrical";
  }
  if (["water", "leak", "pipe", "tap"].some((word) => text.includes(word))) {
    return "Plumbing";
  }
  if (["wifi", "internet", "network"].some((word) => text.includes(word))) {
    return "IT";
  }
  if (["garbage", "dirty", "clean", "waste"].some((word) => text.includes(word))) {
    return "Sanitation";
  }

  return "General";
}

function getDepartment(category) {
  return categoryDepartmentMap[category] || categoryDepartmentMap.General;
}

function getPriorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function getRoleLabel(role) {
  if (role === "staff") {
    return "Department Staff";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Student";
}

function canUpdateStatus() {
  return state.auth && (state.auth.role === "staff" || state.auth.role === "admin");
}

function getVisibleIssues() {
  if (!state.auth) {
    return [];
  }

  if (state.auth.role === "student") {
    return state.issues.filter(
      (issue) => !issue.immediate_action || issue.status !== "Resolved",
    );
  }

  if (state.auth.role === "staff") {
    return state.issues.filter(
      (issue) => issue.department === state.auth.department,
    );
  }

  return state.issues;
}

function getSelectedIssue(issues) {
  if (!issues.length) {
    return null;
  }

  return (
    issues.find((issue) => issue.id === state.selectedIssueId) ||
    issues[0]
  );
}

function renderLoginView() {
  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-card auth-copy">
        <p class="hero-kicker">IssueOps Phase 2</p>
        <h1>Role-based issue tracking for students, staff, and admins.</h1>
        <p class="hero-body">
          Sign in with a demo role to explore reporting, department triage, and issue updates from a single workflow.
        </p>
        <div class="auth-badges">
          <span>Student reporting</span>
          <span>Staff triage</span>
          <span>Admin oversight</span>
        </div>
      </section>
      <section class="auth-card auth-form-card">
        <div class="panel-heading">
          <p class="eyebrow">Demo access</p>
          <h2>Sign in</h2>
          <p>This is a frontend-only Phase 2 login flow for navigating role-specific dashboards.</p>
        </div>
        <form id="login-form" class="report-form">
          <label>
            Name
            <input name="name" type="text" maxlength="60" placeholder="Aarav" required />
          </label>
          <label>
            Email
            <input name="email" type="email" maxlength="120" placeholder="aarav@campus.edu" required />
          </label>
          <div class="form-row">
            <label>
              Role
              <select name="role">
                <option value="student">Student</option>
                <option value="staff">Department Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Department
              <select name="department">
                <option value="Electrical Department">Electrical Department</option>
                <option value="Plumbing Department">Plumbing Department</option>
                <option value="IT Support">IT Support</option>
                <option value="Sanitation Department">Sanitation Department</option>
                <option value="Campus Operations">Campus Operations</option>
              </select>
            </label>
          </div>
          <button type="submit" class="submit-button">Enter dashboard</button>
        </form>
      </section>
    </div>
  `;

  const loginForm = document.querySelector("#login-form");
  loginForm.addEventListener("submit", handleLogin);
}

function render() {
  if (!state.auth) {
    renderLoginView();
    return;
  }

  const visibleIssues = getVisibleIssues();
  const selectedIssue = getSelectedIssue(visibleIssues);
  if (selectedIssue) {
    state.selectedIssueId = selectedIssue.id;
  }

  const counts = {
    total: visibleIssues.length,
    urgent: visibleIssues.filter((issue) => issue.immediate_action).length,
    open: visibleIssues.filter((issue) => issue.status !== "Resolved").length,
    resolved: visibleIssues.filter((issue) => issue.status === "Resolved").length,
  };

  const issueCards = state.loading
    ? `<div class="empty-state">Loading issues...</div>`
    : visibleIssues.length
      ? visibleIssues
          .map(
            (issue) => `
              <button class="issue-card issue-select-card ${issue.immediate_action ? "issue-card-urgent" : ""} ${
                selectedIssue && selectedIssue.id === issue.id ? "issue-card-selected" : ""
              }" data-issue-id="${issue.id}" type="button">
                <div class="issue-card-header">
                  <div>
                    <p class="eyebrow">${escapeHtml(issue.department)}</p>
                    <h3>${escapeHtml(issue.title)}</h3>
                  </div>
                  <span class="priority-badge ${getPriorityClass(issue.priority)}">${escapeHtml(issue.priority)}</span>
                </div>
                <p class="issue-description">${escapeHtml(issue.description)}</p>
                <div class="issue-meta">
                  <span>${escapeHtml(issue.category)}</span>
                  <span>${escapeHtml(issue.location)}</span>
                  <span>${issue.report_count} report${issue.report_count === 1 ? "" : "s"}</span>
                </div>
                <div class="issue-footer">
                  <span class="status-badge ${getStatusClass(issue.status)}">${escapeHtml(issue.status)}</span>
                  ${
                    issue.immediate_action
                      ? `<span class="urgent-flag">Requires Immediate Action</span>`
                      : ""
                  }
                </div>
              </button>
            `,
          )
          .join("")
      : `<div class="empty-state">No issues visible for this role yet.</div>`;

  const detailPanel = selectedIssue
    ? `
      <div class="detail-stack">
        <div class="detail-header">
          <div>
            <p class="eyebrow">${escapeHtml(selectedIssue.department)}</p>
            <h2>${escapeHtml(selectedIssue.title)}</h2>
          </div>
          <span class="priority-badge ${getPriorityClass(selectedIssue.priority)}">${escapeHtml(selectedIssue.priority)}</span>
        </div>
        <p class="issue-description">${escapeHtml(selectedIssue.description)}</p>
        <div class="detail-grid">
          <div class="detail-chip"><span>Status</span><strong>${escapeHtml(selectedIssue.status)}</strong></div>
          <div class="detail-chip"><span>Category</span><strong>${escapeHtml(selectedIssue.category)}</strong></div>
          <div class="detail-chip"><span>Location</span><strong>${escapeHtml(selectedIssue.location)}</strong></div>
          <div class="detail-chip"><span>Reports</span><strong>${selectedIssue.report_count}</strong></div>
        </div>
        ${
          selectedIssue.immediate_action
            ? `<div class="detail-alert">This issue has crossed the escalation threshold and requires immediate action.</div>`
            : ""
        }
        <div class="timeline-card">
          <h3>Status journey</h3>
          <ol class="timeline-list">
            ${suggestedStatuses
              .map(
                (status) => `
                  <li class="${
                    status === selectedIssue.status ? "timeline-current" : ""
                  }">${escapeHtml(status)}</li>
                `,
              )
              .join("")}
          </ol>
        </div>
        ${
          canUpdateStatus()
            ? `
              <form id="status-form" class="status-form">
                <label>
                  Update issue status
                  <select name="status">
                    ${suggestedStatuses
                      .map(
                        (status) => `
                          <option value="${escapeHtml(status)}" ${
                            status === selectedIssue.status ? "selected" : ""
                          }>${escapeHtml(status)}</option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
                <button type="submit" class="submit-button" ${
                  state.statusUpdating ? "disabled" : ""
                }>
                  ${state.statusUpdating ? "Saving..." : "Save status"}
                </button>
              </form>
            `
            : `
              <div class="timeline-card">
                <h3>Student visibility</h3>
                <p class="issue-description">Students can view status, urgency, and department ownership here. Status changes are handled by staff and admins.</p>
              </div>
            `
        }
      </div>
    `
    : `<div class="empty-state">Select an issue to see its details.</div>`;

  app.innerHTML = `
    <div class="page-shell">
      <header class="dashboard-topbar panel">
        <div>
          <p class="hero-kicker">IssueOps dashboard</p>
          <h1 class="dashboard-title">${escapeHtml(getRoleLabel(state.auth.role))} workspace</h1>
          <p class="hero-body">Signed in as ${escapeHtml(state.auth.name)}${state.auth.role === "staff" ? ` for ${escapeHtml(state.auth.department)}` : ""}.</p>
        </div>
        <div class="topbar-actions">
          <div class="topbar-user">
            <span>${escapeHtml(state.auth.name)}</span>
            <strong>${escapeHtml(getRoleLabel(state.auth.role))}</strong>
          </div>
          <button id="logout-button" class="secondary-link button-reset" type="button">Log out</button>
        </div>
      </header>

      <section class="stats-grid dashboard-stats">
        <div class="stat-card">
          <strong>${counts.total}</strong>
          <span>Visible issues</span>
        </div>
        <div class="stat-card">
          <strong>${counts.open}</strong>
          <span>Open issues</span>
        </div>
        <div class="stat-card">
          <strong>${counts.urgent}</strong>
          <span>Urgent issues</span>
        </div>
        <div class="stat-card">
          <strong>${counts.resolved}</strong>
          <span>Resolved issues</span>
        </div>
      </section>

      <section class="workspace-grid dashboard-grid">
        <section class="panel panel-form">
          <div class="panel-heading">
            <p class="eyebrow">Create complaint</p>
            <h2>Report an issue</h2>
            <p>Students can submit new issues here, while staff and admins can use it to simulate incoming reports during testing.</p>
          </div>
          <form id="report-form" class="report-form">
            <label>
              Issue title
              <input name="title" type="text" maxlength="120" placeholder="Light not working in corridor" required />
            </label>
            <label>
              Description
              <textarea name="description" rows="5" placeholder="Describe what is happening, where it is, and how serious it feels." required></textarea>
            </label>
            <div class="form-row">
              <label>
                Category
                <select name="category">
                  <option value="">Auto-detect from description</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="IT">IT</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="General">General</option>
                </select>
              </label>
              <label>
                Location
                <input name="location" type="text" maxlength="120" placeholder="Block A - 2nd Floor" />
              </label>
            </div>
            <div id="form-preview" class="form-preview"></div>
            <button type="submit" class="submit-button" ${state.submitting ? "disabled" : ""}>
              ${state.submitting ? "Submitting..." : "Submit issue"}
            </button>
            <p class="form-note">Suggested status flow: ${suggestedStatuses.join(" -> ")}</p>
            ${state.error ? `<p class="form-error">${escapeHtml(state.error)}</p>` : ""}
          </form>
        </section>

        <section class="panel panel-board">
          <div class="panel-heading">
            <p class="eyebrow">${
              state.auth.role === "student"
                ? "Student dashboard"
                : state.auth.role === "staff"
                  ? "Department queue"
                  : "Admin overview"
            }</p>
            <h2>Issue board</h2>
            <p>${
              state.auth.role === "student"
                ? "Track issue progress, view urgent problems, and open issue details."
                : state.auth.role === "staff"
                  ? "See department-owned issues and update their status as work progresses."
                  : "Monitor all departments, escalations, and active complaints."
            }</p>
          </div>
          <div class="issue-board">${issueCards}</div>
        </section>
      </section>

      <section class="workspace-grid dashboard-grid">
        <section class="panel panel-detail">
          <div class="panel-heading">
            <p class="eyebrow">Issue detail</p>
            <h2>Selected issue</h2>
            <p>Review the issue summary, escalation state, and current lifecycle stage.</p>
          </div>
          ${detailPanel}
        </section>
        <section class="panel">
          <div class="panel-heading">
            <p class="eyebrow">Role guide</p>
            <h2>${escapeHtml(getRoleLabel(state.auth.role))} actions</h2>
            <p>${
              state.auth.role === "student"
                ? "Students can submit complaints, browse visible issues, and watch status changes."
                : state.auth.role === "staff"
                  ? "Department staff can focus on assigned issues and update statuses from this screen."
                  : "Admins can monitor all issues across departments and coordinate response."
            }</p>
          </div>
          <div class="highlight-card">
            <span class="highlight-label">Current role</span>
            <ul class="workflow-list">
              <li>${escapeHtml(getRoleLabel(state.auth.role))}</li>
              <li>${
                state.auth.role === "staff"
                  ? `Department scope: ${escapeHtml(state.auth.department)}`
                  : "Cross-campus visibility"
              }</li>
              <li>Issue detail and routing context included</li>
              <li>Status updates ${
                canUpdateStatus() ? "enabled" : "visible in read-only mode"
              }</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  `;

  attachFormListeners();
  attachDashboardListeners();
  updateFormPreview();
}

function attachFormListeners() {
  const form = document.querySelector("#report-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", handleSubmit);
  form.description.addEventListener("input", updateFormPreview);
  form.category.addEventListener("change", updateFormPreview);
  form.location.addEventListener("input", updateFormPreview);
}

function attachDashboardListeners() {
  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearSession();
      state.selectedIssueId = null;
      render();
    });
  }

  document.querySelectorAll("[data-issue-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIssueId = Number(button.dataset.issueId);
      render();
    });
  });

  const statusForm = document.querySelector("#status-form");
  if (statusForm && state.selectedIssueId) {
    statusForm.addEventListener("submit", handleStatusUpdate);
  }
}

function updateFormPreview() {
  const form = document.querySelector("#report-form");
  const preview = document.querySelector("#form-preview");
  if (!form || !preview) {
    return;
  }

  const category = form.category.value || detectCategory(form.description.value || "");
  const department = getDepartment(category);
  const location = form.location.value.trim() || "Not specified";

  preview.innerHTML = `
    <div class="preview-chip">
      <span class="preview-label">Detected category</span>
      <strong>${escapeHtml(category)}</strong>
    </div>
    <div class="preview-chip">
      <span class="preview-label">Assigned department</span>
      <strong>${escapeHtml(department)}</strong>
    </div>
    <div class="preview-chip">
      <span class="preview-label">Location</span>
      <strong>${escapeHtml(location)}</strong>
    </div>
  `;
}

async function fetchIssues() {
  state.loading = true;
  state.error = "";
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/issues`);
    if (!response.ok) {
      throw new Error("Could not load issues from the backend.");
    }

    state.issues = await response.json();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;

  saveSession({
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    role: form.role.value,
    department: form.department.value,
  });

  state.selectedIssueId = null;
  render();
  fetchIssues();
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    category: form.category.value || null,
    location: form.location.value.trim() || null,
  };

  state.error = "";

  if (!payload.title || !payload.description) {
    state.error = "Title and description are required.";
    render();
    return;
  }

  state.submitting = true;
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Issue submission failed. Make sure the FastAPI server is running.");
    }

    form.reset();
    await fetchIssues();
  } catch (error) {
    state.error = error.message;
    state.submitting = false;
    render();
    updateFormPreview();
    return;
  }

  state.submitting = false;
  render();
}

async function handleStatusUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const selectedStatus = form.status.value;

  if (!state.selectedIssueId) {
    return;
  }

  state.statusUpdating = true;
  state.error = "";
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/issues/${state.selectedIssueId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: selectedStatus }),
    });

    if (!response.ok) {
      throw new Error("Could not update issue status.");
    }

    await fetchIssues();
  } catch (error) {
    state.error = error.message;
    state.statusUpdating = false;
    render();
    return;
  }

  state.statusUpdating = false;
  render();
}

render();
if (state.auth) {
  fetchIssues();
}
