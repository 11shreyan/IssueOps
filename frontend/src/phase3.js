import "./style.css";

const app = document.querySelector("#app");
const API_BASE_URL = "http://127.0.0.1:8000";
const SESSION_KEY = "issueops-session";
const THEME_KEY = "issueops-theme";

const categoryDepartmentMap = {
  Electrical: "Electrical Department",
  Plumbing: "Plumbing Department",
  IT: "IT Support",
  Sanitation: "Sanitation Department",
  General: "Campus Operations",
};

const suggestedStatuses = ["Reported", "Acknowledged", "In Progress", "Resolved"];
const departmentOptions = [
  "Electrical Department",
  "Plumbing Department",
  "IT Support",
  "Sanitation Department",
  "Campus Operations",
];

const state = {
  issues: [],
  stats: { total: 0, open: 0, urgent: 0, resolved: 0 },
  loading: false,
  submitting: false,
  statusUpdating: false,
  authLoading: false,
  error: "",
  selectedIssueId: null,
  authMode: "login",
  auth: loadSession(),
  theme: loadTheme(),
  profileMenuOpen: false,
  profileModalOpen: false,
  profileSaving: false,
  profileMessage: "",
  profileImageDraft: null,
  profileCrop: { offsetX: 50, offsetY: 50 },
  profileImageName: "",
};

function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
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

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function saveTheme(theme) {
  state.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

function clearSession() {
  state.auth = null;
  state.issues = [];
  state.stats = { total: 0, open: 0, urgent: 0, resolved: 0 };
  localStorage.removeItem(SESSION_KEY);
}

function toggleTheme() {
  saveTheme(state.theme === "dark" ? "light" : "dark");
  render();
}

function toggleProfileMenu() {
  state.profileMenuOpen = !state.profileMenuOpen;
  render();
}

function openProfileModal() {
  state.profileMenuOpen = false;
  state.profileModalOpen = true;
  state.profileMessage = "";
  state.profileImageDraft = state.auth?.profile_image || null;
  state.profileCrop = { offsetX: 50, offsetY: 50 };
  state.profileImageName = state.auth?.profile_image ? "Current photo" : "";
  render();
}

function closeProfileModal() {
  state.profileModalOpen = false;
  state.profileMessage = "";
  state.profileImageDraft = null;
  state.profileCrop = { offsetX: 50, offsetY: 50 };
  state.profileImageName = "";
  render();
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
  if (["light", "fan", "power", "switch"].some((word) => text.includes(word))) return "Electrical";
  if (["water", "leak", "pipe", "tap"].some((word) => text.includes(word))) return "Plumbing";
  if (["wifi", "internet", "network"].some((word) => text.includes(word))) return "IT";
  if (["garbage", "dirty", "clean", "waste"].some((word) => text.includes(word))) return "Sanitation";
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
  if (role === "staff") return "Department Staff";
  if (role === "admin") return "Admin";
  return "Student";
}

function getFirstName(name) {
  return (name || "").trim().split(/\s+/)[0] || "there";
}

function splitName(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: "", middleName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function getGreeting(name) {
  const hour = new Date().getHours();
  const firstName = getFirstName(name);

  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
  return `Good night, ${firstName}`;
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "IO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function renderAvatar(image, name, className = "") {
  if (image) {
    return `<div class="avatar ${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" /></div>`;
  }

  return `<div class="avatar avatar-fallback ${className}" aria-hidden="true">${escapeHtml(getInitials(name))}</div>`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function getCropImageStyle() {
  const translateX = (state.profileCrop.offsetX - 50) * 0.7;
  const translateY = (state.profileCrop.offsetY - 50) * 0.7;
  return `transform: translate(${translateX}%, ${translateY}%);`;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = source;
  });
}

async function createCroppedProfileImage(source) {
  if (!source) return null;

  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const size = 320;
  const { offsetX, offsetY } = state.profileCrop;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare the crop preview.");
  }

  const baseScale = Math.max(size / image.width, size / image.height);
  const drawWidth = image.width * baseScale;
  const drawHeight = image.height * baseScale;
  const maxOffsetX = Math.max(0, drawWidth - size);
  const maxOffsetY = Math.max(0, drawHeight - size);
  const sourceX = ((size - drawWidth) / 2) - maxOffsetX * ((offsetX - 50) / 100);
  const sourceY = ((size - drawHeight) / 2) - maxOffsetY * ((offsetY - 50) / 100);

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(image, sourceX, sourceY, drawWidth, drawHeight);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function canUpdateStatus() {
  return state.auth && (state.auth.role === "staff" || state.auth.role === "admin");
}

function clampCropOffset(value) {
  return Math.max(0, Math.min(100, value));
}

function getSelectedIssue(issues) {
  if (!issues.length) return null;
  return issues.find((issue) => issue.id === state.selectedIssueId) || issues[0];
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${state.auth.access_token}`,
  };
}

function renderLoginView() {
  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-card auth-form-card">
        <div class="auth-toolbar auth-toolbar-compact">
          <button
            id="theme-toggle"
            class="theme-toggle"
            type="button"
            aria-label="${state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}"
            title="${state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}"
          >
            <span class="theme-toggle-track">
              <span class="theme-icon theme-icon-sun">☀️</span>
              <span class="theme-icon theme-icon-moon">🌙</span>
              <span class="theme-toggle-thumb"></span>
            </span>
          </button>
        </div>
        <div class="panel-heading">
          <p class="eyebrow">IssueOps</p>
          <h2>${state.authMode === "login" ? "Sign in" : "Create account"}</h2>
        </div>
        <div class="auth-toggle">
          <button class="tab-button ${state.authMode === "login" ? "tab-active" : ""}" data-auth-mode="login" type="button">Login</button>
          <button class="tab-button ${state.authMode === "register" ? "tab-active" : ""}" data-auth-mode="register" type="button">Register</button>
        </div>
        <form id="auth-form" class="report-form">
          ${
            state.authMode === "register"
              ? `<label>
                  Name
                  <input name="name" type="text" maxlength="60" placeholder="Aarav" required />
                </label>`
              : ""
          }
          <label>
            Email
            <input name="email" type="email" maxlength="120" placeholder="aarav@campus.edu" required />
          </label>
          <label>
            Password
            <div class="password-field">
              <input name="password" type="password" maxlength="120" placeholder="Enter password" required />
              <button type="button" class="password-toggle" data-password-toggle>
                Show
              </button>
            </div>
          </label>
          ${
            state.authMode === "register"
              ? `<div class="form-row">
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
                      <option value="">No department</option>
                      <option value="Electrical Department">Electrical Department</option>
                      <option value="Plumbing Department">Plumbing Department</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Sanitation Department">Sanitation Department</option>
                      <option value="Campus Operations">Campus Operations</option>
                    </select>
                  </label>
                </div>`
              : ""
          }
          <button type="submit" class="submit-button" ${state.authLoading ? "disabled" : ""}>
            ${state.authLoading ? "Please wait..." : state.authMode === "login" ? "Enter dashboard" : "Create account"}
          </button>
          ${state.error ? `<p class="form-error">${escapeHtml(state.error)}</p>` : ""}
        </form>
      </section>
    </div>
  `;

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      state.error = "";
      render();
    });
  });

  document.querySelector("#auth-form").addEventListener("submit", handleAuthSubmit);
  document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);
  attachPasswordToggle();
}

function render() {
  if (!state.auth) {
    renderLoginView();
    return;
  }

  const profileName = splitName(state.auth.name);

  const selectedIssue = getSelectedIssue(state.issues);
  if (selectedIssue) state.selectedIssueId = selectedIssue.id;

  const issueCards = state.loading
    ? `<div class="empty-state">Loading issues...</div>`
    : state.issues.length
      ? state.issues.map((issue) => `
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
              ${issue.immediate_action ? `<span class="urgent-flag">Requires Immediate Action</span>` : ""}
            </div>
          </button>
        `).join("")
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
          <div class="detail-chip"><span>Reporter</span><strong>${escapeHtml(selectedIssue.reported_by_name)}</strong></div>
          <div class="detail-chip"><span>Reporter role</span><strong>${escapeHtml(selectedIssue.reported_by_role)}</strong></div>
        </div>
        ${selectedIssue.immediate_action ? `<div class="detail-alert">This issue has crossed the escalation threshold and requires immediate action.</div>` : ""}
        <div class="timeline-card">
          <h3>Status journey</h3>
          <ol class="timeline-list">
            ${suggestedStatuses.map((status) => `<li class="${status === selectedIssue.status ? "timeline-current" : ""}">${escapeHtml(status)}</li>`).join("")}
          </ol>
        </div>
        ${canUpdateStatus()
          ? `<form id="status-form" class="status-form">
              <label>
                Update issue status
                <select name="status">
                  ${suggestedStatuses.map((status) => `<option value="${escapeHtml(status)}" ${status === selectedIssue.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
                </select>
              </label>
              <button type="submit" class="submit-button" ${state.statusUpdating ? "disabled" : ""}>
                ${state.statusUpdating ? "Saving..." : "Save status"}
              </button>
            </form>`
          : `<div class="timeline-card"><h3>Student visibility</h3><p class="issue-description">Students can view status, urgency, department ownership, and who reported the issue.</p></div>`}
      </div>
    `
    : `<div class="empty-state">Select an issue to see its details.</div>`;

  const profileModal = state.profileModalOpen
    ? `
      <div class="modal-backdrop" id="profile-modal-backdrop">
        <section class="profile-modal panel" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          <div class="profile-modal-header">
            <div>
              <p class="eyebrow">Customize Profile</p>
              <h2 id="profile-modal-title">Personal details</h2>
            </div>
            <button id="close-profile-modal" class="modal-close-button" type="button" aria-label="Close customize profile">×</button>
          </div>
          <form id="profile-form" class="report-form profile-form">
            <div class="profile-avatar-section">
              <div class="profile-crop-column">
                <div class="profile-crop-frame">
                  ${
                    state.profileImageDraft
                      ? `<img class="profile-crop-image" src="${escapeHtml(state.profileImageDraft)}" alt="${escapeHtml(state.auth.name)}" style="${getCropImageStyle()}" />`
                      : renderAvatar(null, state.auth.name, "profile-avatar-large")
                  }
                </div>
              </div>
              <div class="profile-avatar-fields">
                <label>
                  Profile picture
                  <input id="profile-image-input" class="profile-file-input" name="profileImage" type="file" accept="image/*" />
                  <div class="profile-upload-actions">
                    <button id="profile-image-trigger" class="secondary-button profile-upload-button" type="button">Choose photo</button>
                    <button id="remove-profile-image" class="secondary-button profile-upload-button" type="button">Remove photo</button>
                  </div>
                  <span class="profile-file-name">${escapeHtml(state.profileImageName || "No file chosen")}</span>
                </label>
              </div>
            </div>
            <div class="form-row profile-name-row">
              <label>
                First name
                <input name="firstName" type="text" maxlength="30" value="${escapeHtml(profileName.firstName)}" required />
              </label>
              <label>
                Middle name
                <input name="middleName" type="text" maxlength="30" value="${escapeHtml(profileName.middleName)}" />
              </label>
            </div>
            <label>
              Last name
              <input name="lastName" type="text" maxlength="30" value="${escapeHtml(profileName.lastName)}" required />
            </label>
            <div class="form-row">
              <label>
                Email
                <input type="email" value="${escapeHtml(state.auth.email || "")}" disabled />
              </label>
              <label>
                Role
                <input type="text" value="${escapeHtml(getRoleLabel(state.auth.role))}" disabled />
              </label>
            </div>
            <label>
              Department
              <select name="department">
                <option value="">No department</option>
                ${departmentOptions
                  .map(
                    (department) =>
                      `<option value="${escapeHtml(department)}" ${state.auth.department === department ? "selected" : ""}>${escapeHtml(department)}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <div class="profile-form-actions">
              <button id="cancel-profile-button" class="secondary-button" type="button">Cancel</button>
              <button type="submit" class="submit-button" ${state.profileSaving ? "disabled" : ""}>
                ${state.profileSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
            ${state.profileMessage ? `<p class="form-note">${escapeHtml(state.profileMessage)}</p>` : ""}
          </form>
        </section>
      </div>
    `
    : "";

  app.innerHTML = `
    <div class="page-shell">
      <header class="dashboard-topbar panel">
        <div>
          <p class="hero-kicker">IssueOps dashboard</p>
          <h1 class="dashboard-title">${escapeHtml(getRoleLabel(state.auth.role))} workspace</h1>
          <p class="hero-body">${escapeHtml(getGreeting(state.auth.name))}${state.auth.department ? ` · ${escapeHtml(state.auth.department)}` : ""}</p>
        </div>
        <div class="topbar-actions">
          <button
            id="theme-toggle"
            class="theme-toggle"
            type="button"
            aria-label="${state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}"
            title="${state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}"
          >
            <span class="theme-toggle-track">
              <span class="theme-icon theme-icon-sun">☀️</span>
              <span class="theme-icon theme-icon-moon">🌙</span>
              <span class="theme-toggle-thumb"></span>
            </span>
          </button>
          <div class="profile-menu-wrap">
            <button
              id="profile-menu-button"
              class="profile-trigger"
              type="button"
              aria-expanded="${state.profileMenuOpen ? "true" : "false"}"
              aria-label="Open profile menu"
            >
              ${renderAvatar(state.auth.profile_image, state.auth.name, "topbar-avatar")}
            </button>
            ${
              state.profileMenuOpen
                ? `<div class="profile-menu">
                      <button id="customize-profile-button" class="profile-menu-item" type="button">Customize profile</button>
                      <button id="logout-button" class="profile-menu-item" type="button">Logout</button>
                    </div>`
                : ""
            }
          </div>
        </div>
      </header>

      <section class="panel dashboard-overview">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Overview</p>
            <h2>Workspace snapshot</h2>
          </div>
          <p class="section-copy">Your current workload is grouped here so the important numbers are visible before you dive into the details.</p>
        </div>
        <div class="stats-grid dashboard-stats">
          <div class="stat-card"><strong>${state.stats.total}</strong><span>Visible issues</span></div>
          <div class="stat-card"><strong>${state.stats.open}</strong><span>Open issues</span></div>
          <div class="stat-card"><strong>${state.stats.urgent}</strong><span>Urgent issues</span></div>
          <div class="stat-card"><strong>${state.stats.resolved}</strong><span>Resolved issues</span></div>
        </div>
      </section>

      <section class="dashboard-layout">
        <div class="dashboard-main-stack">
          <section class="panel panel-form">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Create Complaint</p>
                <h2>Report an issue</h2>
              </div>
              <p class="section-copy">Authenticated users can submit complaints and the backend records who reported them.</p>
            </div>
            <form id="report-form" class="report-form">
              <label>Issue title<input name="title" type="text" maxlength="120" placeholder="Light not working in corridor" required /></label>
              <label>Description<textarea name="description" rows="5" placeholder="Describe what is happening, where it is, and how serious it feels." required></textarea></label>
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
                <label>Location<input name="location" type="text" maxlength="120" placeholder="Block A - 2nd Floor" /></label>
              </div>
              <div id="form-preview" class="form-preview"></div>
              <button type="submit" class="submit-button" ${state.submitting ? "disabled" : ""}>${state.submitting ? "Submitting..." : "Submit issue"}</button>
              <p class="form-note">Suggested status flow: ${suggestedStatuses.join(" -> ")}</p>
              ${state.error ? `<p class="form-error">${escapeHtml(state.error)}</p>` : ""}
            </form>
          </section>

          <section class="panel panel-board">
            <div class="section-heading">
              <div>
                <p class="eyebrow">${state.auth.role === "student" ? "Student Dashboard" : state.auth.role === "staff" ? "Department Queue" : "Admin Overview"}</p>
                <h2>Issue board</h2>
              </div>
              <p class="section-copy">${state.auth.role === "student" ? "This list comes from /dashboard/student and only includes your submitted issues." : state.auth.role === "staff" ? "This list comes from /dashboard/staff and is filtered by your assigned department." : "This list comes from /dashboard/admin and shows the full campus issue load."}</p>
            </div>
            <div class="issue-board">${issueCards}</div>
          </section>
        </div>

        <aside class="dashboard-side-stack">
          <section class="panel panel-detail">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Issue Detail</p>
                <h2>Selected issue</h2>
              </div>
              <p class="section-copy">Review the summary, escalation state, and current lifecycle stage in one place.</p>
            </div>
            ${detailPanel}
          </section>

          <section class="panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Role Guide</p>
                <h2>${escapeHtml(getRoleLabel(state.auth.role))} actions</h2>
              </div>
              <p class="section-copy">${state.auth.role === "student" ? "Students can register, log in, report issues, and view their own issue history from the backend." : state.auth.role === "staff" ? "Department staff can authenticate, see only their queue, and update issue statuses." : "Admins can authenticate, view system-wide issue load, and oversee escalations across departments."}</p>
            </div>
            <div class="highlight-card">
              <span class="highlight-label">Current role</span>
              <ul class="workflow-list">
                <li>${escapeHtml(getRoleLabel(state.auth.role))}</li>
                <li>${state.auth.department ? `Department scope: ${escapeHtml(state.auth.department)}` : "Cross-campus visibility"}</li>
                <li>Backend token auth enabled</li>
                <li>Status updates ${canUpdateStatus() ? "enabled" : "visible in read-only mode"}</li>
              </ul>
            </div>
          </section>
        </aside>
      </section>
    </div>
    ${profileModal}
  `;

  attachFormListeners();
  attachDashboardListeners();
  updateFormPreview();
}

function attachFormListeners() {
  const form = document.querySelector("#report-form");
  if (!form) return;
  form.addEventListener("submit", handleSubmit);
  form.description.addEventListener("input", updateFormPreview);
  form.category.addEventListener("change", updateFormPreview);
  form.location.addEventListener("input", updateFormPreview);
}

function attachDashboardListeners() {
  const themeToggle = document.querySelector("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  const profileMenuButton = document.querySelector("#profile-menu-button");
  if (profileMenuButton) {
    profileMenuButton.addEventListener("click", toggleProfileMenu);
  }

  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearSession();
      state.selectedIssueId = null;
      state.error = "";
      state.profileMenuOpen = false;
      render();
    });
  }

  const customizeProfileButton = document.querySelector("#customize-profile-button");
  if (customizeProfileButton) {
    customizeProfileButton.addEventListener("click", openProfileModal);
  }

  document.querySelectorAll("[data-issue-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIssueId = Number(button.dataset.issueId);
      state.profileMenuOpen = false;
      render();
    });
  });

  const statusForm = document.querySelector("#status-form");
  if (statusForm && state.selectedIssueId) statusForm.addEventListener("submit", handleStatusUpdate);

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSave);
  }

  const profileImageInput = document.querySelector("#profile-image-input");
  if (profileImageInput) {
    profileImageInput.addEventListener("change", handleProfileImageChange);
  }

  const profileImageTrigger = document.querySelector("#profile-image-trigger");
  if (profileImageTrigger && profileImageInput) {
    profileImageTrigger.addEventListener("click", () => profileImageInput.click());
  }

  const profileCropFrame = document.querySelector(".profile-crop-frame");
  const profileCropImage = document.querySelector(".profile-crop-image");
  if (profileCropFrame && profileCropImage) {
    attachProfileCropDrag(profileCropFrame);
  }

  const removeProfileImageButton = document.querySelector("#remove-profile-image");
  if (removeProfileImageButton) {
    removeProfileImageButton.addEventListener("click", () => {
      state.profileImageDraft = null;
      state.profileMessage = "";
      state.profileCrop = { offsetX: 50, offsetY: 50 };
      state.profileImageName = "";
      render();
    });
  }

  const cancelProfileButton = document.querySelector("#cancel-profile-button");
  if (cancelProfileButton) {
    cancelProfileButton.addEventListener("click", closeProfileModal);
  }

  const closeProfileModalButton = document.querySelector("#close-profile-modal");
  if (closeProfileModalButton) {
    closeProfileModalButton.addEventListener("click", closeProfileModal);
  }

  const profileBackdrop = document.querySelector("#profile-modal-backdrop");
  if (profileBackdrop) {
    profileBackdrop.addEventListener("click", (event) => {
      if (event.target === profileBackdrop) {
        closeProfileModal();
      }
    });
  }
}

function updateFormPreview() {
  const form = document.querySelector("#report-form");
  const preview = document.querySelector("#form-preview");
  if (!form || !preview) return;

  const category = form.category.value || detectCategory(form.description.value || "");
  const department = getDepartment(category);
  const location = form.location.value.trim() || "Not specified";

  preview.innerHTML = `
    <div class="preview-chip"><span class="preview-label">Detected category</span><strong>${escapeHtml(category)}</strong></div>
    <div class="preview-chip"><span class="preview-label">Assigned department</span><strong>${escapeHtml(department)}</strong></div>
    <div class="preview-chip"><span class="preview-label">Location</span><strong>${escapeHtml(location)}</strong></div>
  `;
}

function attachPasswordToggle() {
  const toggle = document.querySelector("[data-password-toggle]");
  const passwordInput = document.querySelector('input[name="password"]');

  if (!toggle || !passwordInput) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "Hide" : "Show";
  });
}

async function fetchDashboard() {
  if (!state.auth) return;
  state.loading = true;
  state.error = "";
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/${state.auth.role}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Could not load dashboard data.");
    }
    const payload = await response.json();
    state.issues = payload.issues;
    state.stats = payload.stats;
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const isRegister = state.authMode === "register";
  state.authLoading = true;
  state.error = "";
  render();

  try {
    const payload = isRegister
      ? {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
          role: form.role.value,
          department: form.department.value || null,
        }
      : {
          email: form.email.value.trim(),
          password: form.password.value,
        };

    const response = await fetch(`${API_BASE_URL}/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Authentication failed.");
    }

    const result = await response.json();
    saveSession({ access_token: result.access_token, ...result.user });
    state.authLoading = false;
    state.selectedIssueId = null;
    render();
    fetchDashboard();
  } catch (error) {
    state.authLoading = false;
    state.error = error.message;
    render();
  }
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
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Issue submission failed.");
    }

    form.reset();
    await fetchDashboard();
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
  if (!state.selectedIssueId) return;

  state.statusUpdating = true;
  state.error = "";
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/issues/${state.selectedIssueId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: form.status.value }),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Could not update issue status.");
    }

    await fetchDashboard();
  } catch (error) {
    state.error = error.message;
    state.statusUpdating = false;
    render();
    return;
  }

  state.statusUpdating = false;
  render();
}

async function handleProfileSave(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const firstName = form.firstName.value.trim();
  const middleName = form.middleName.value.trim();
  const lastName = form.lastName.value.trim();

  if (!firstName || !lastName) {
    state.profileMessage = "First name and last name are required.";
    render();
    return;
  }

  state.profileSaving = true;
  state.profileMessage = "";
  render();

  try {
    const croppedProfileImage = state.profileImageDraft
      ? await createCroppedProfileImage(state.profileImageDraft)
      : null;
    const payload = {
      name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      department: form.department.value || null,
      profile_image: croppedProfileImage,
    };

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || "Could not update your profile.");
    }

    const result = await response.json();
    saveSession({ access_token: result.access_token, ...result.user });
    state.profileSaving = false;
    state.profileModalOpen = false;
    state.profileMessage = "";
    state.profileImageDraft = null;
    render();
    fetchDashboard();
  } catch (error) {
    state.profileSaving = false;
    state.profileMessage = error.message;
    render();
  }
}

async function handleProfileImageChange(event) {
  const file = event.currentTarget.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    state.profileMessage = "Please choose an image file.";
    render();
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    state.profileMessage = "Please choose an image smaller than 2 MB.";
    render();
    return;
  }

  try {
    state.profileImageDraft = await readFileAsDataUrl(file);
    state.profileCrop = { offsetX: 50, offsetY: 50 };
    state.profileImageName = file.name;
    state.profileMessage = "";
    render();
  } catch (error) {
    state.profileMessage = error.message;
    render();
  }
}

function attachProfileCropDrag(frame) {
  let startX = 0;
  let startY = 0;
  let startOffsetX = state.profileCrop.offsetX;
  let startOffsetY = state.profileCrop.offsetY;
  let dragging = false;

  const updatePreview = () => {
    const image = frame.querySelector(".profile-crop-image");
    if (image) {
      image.style.transform = getCropImageStyle().replace("transform: ", "").replace(";", "");
    }
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    state.profileCrop.offsetX = clampCropOffset(startOffsetX + deltaX / 2.2);
    state.profileCrop.offsetY = clampCropOffset(startOffsetY + deltaY / 2.2);
    updatePreview();
  };

  const stopDragging = () => {
    dragging = false;
    frame.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDragging);
  };

  frame.addEventListener("pointerdown", (event) => {
    if (!frame.querySelector(".profile-crop-image")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = state.profileCrop.offsetX;
    startOffsetY = state.profileCrop.offsetY;
    frame.classList.add("is-dragging");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
  });
}

saveTheme(state.theme);
render();
if (state.auth) fetchDashboard();
