const STORAGE_KEY = "project-dashboard-items";

const statusConfig = {
  "On Time": { key: "onTime", color: "#16a34a", badgeClass: "on-time" },
  "At Risk": { key: "risk", color: "#f59e0b", badgeClass: "at-risk" },
  "Delayed": { key: "delayed", color: "#dc2626", badgeClass: "delayed" },
};

const initialProjects = [
  {
    id: crypto.randomUUID(),
    name: "Customer Portal Upgrade",
    owner: "Maya Chen",
    status: "On Time",
    progress: 78,
    dueDate: "2026-07-12",
    notes: "Development sprint is tracking to plan.",
  },
  {
    id: crypto.randomUUID(),
    name: "ERP Data Migration",
    owner: "Noah Smith",
    status: "At Risk",
    progress: 48,
    dueDate: "2026-06-28",
    notes: "Vendor data export is still pending.",
  },
  {
    id: crypto.randomUUID(),
    name: "Warehouse Automation",
    owner: "Aarav Patel",
    status: "Delayed",
    progress: 35,
    dueDate: "2026-06-14",
    notes: "Hardware shipment moved by two weeks.",
  },
  {
    id: crypto.randomUUID(),
    name: "Marketing Analytics Hub",
    owner: "Sofia Garcia",
    status: "On Time",
    progress: 62,
    dueDate: "2026-08-05",
    notes: "Dashboard prototype approved by stakeholders.",
  },
];

let projects = loadProjects();

function loadProjects() {
  const savedProjects = localStorage.getItem(STORAGE_KEY);
  if (!savedProjects) return [...initialProjects];

  try {
    const parsedProjects = JSON.parse(savedProjects);
    return Array.isArray(parsedProjects) ? parsedProjects : [...initialProjects];
  } catch {
    return [...initialProjects];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const form = document.querySelector("#projectForm");
const formTitle = document.querySelector("#formTitle");
const projectId = document.querySelector("#projectId");
const projectName = document.querySelector("#projectName");
const projectOwner = document.querySelector("#projectOwner");
const projectStatus = document.querySelector("#projectStatus");
const projectProgress = document.querySelector("#projectProgress");
const projectDueDate = document.querySelector("#projectDueDate");
const projectNotes = document.querySelector("#projectNotes");
const projectTableBody = document.querySelector("#projectTableBody");
const statusFilter = document.querySelector("#statusFilter");
const emptyState = document.querySelector("#emptyState");
const statusDonut = document.querySelector("#statusDonut");
const statusLegend = document.querySelector("#statusLegend");
const lastUpdated = document.querySelector("#lastUpdated");

function getCounts() {
  return projects.reduce(
    (counts, project) => {
      counts.total += 1;
      counts[statusConfig[project.status].key] += 1;
      return counts;
    },
    { onTime: 0, risk: 0, delayed: 0, total: 0 }
  );
}

function updateStats() {
  const counts = getCounts();
  document.querySelector("#onTimeCount").textContent = counts.onTime;
  document.querySelector("#riskCount").textContent = counts.risk;
  document.querySelector("#delayedCount").textContent = counts.delayed;
  document.querySelector("#totalCount").textContent = counts.total;
  lastUpdated.textContent = `Updated ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  updateDonut(counts);
}

function updateDonut(counts) {
  const total = Math.max(counts.total, 1);
  let start = 0;
  const segments = Object.entries(statusConfig).map(([label, config]) => {
    const value = counts[config.key];
    const degrees = (value / total) * 360;
    const segment = `${config.color} ${start}deg ${start + degrees}deg`;
    start += degrees;
    return segment;
  });

  statusDonut.style.background = `conic-gradient(${segments.join(", ")})`;
  statusDonut.dataset.total = counts.total;
  statusLegend.innerHTML = Object.entries(statusConfig)
    .map(([label, config]) => `
      <div class="legend-item">
        <span><i class="legend-dot" style="background:${config.color}"></i>${label}</span>
        <strong>${counts[config.key]}</strong>
      </div>
    `)
    .join("");
}

function statusBadge(status) {
  return `<span class="status-badge ${statusConfig[status].badgeClass}">${status}</span>`;
}

function renderProjects() {
  const selectedStatus = statusFilter.value;
  const visibleProjects = selectedStatus === "All"
    ? projects
    : projects.filter((project) => project.status === selectedStatus);

  projectTableBody.innerHTML = visibleProjects
    .map((project) => `
      <tr>
        <td>
          <span class="project-title">
            <strong>${escapeHtml(project.name)}</strong>
            <small>ID: ${escapeHtml(project.id.slice(0, 8))}</small>
          </span>
        </td>
        <td>${escapeHtml(project.owner)}</td>
        <td>${statusBadge(project.status)}</td>
        <td>
          <span class="progress-cell">
            <span>${project.progress}% complete</span>
            <span class="progress-track"><span class="progress-bar" style="width:${project.progress}%"></span></span>
          </span>
        </td>
        <td>${formatDate(project.dueDate)}</td>
        <td>${escapeHtml(project.notes || "No update added")}</td>
        <td>
          <span class="actions-cell">
            <button class="table-action" type="button" data-action="edit" data-id="${project.id}">Edit</button>
            <button class="table-action delete" type="button" data-action="delete" data-id="${project.id}">Delete</button>
          </span>
        </td>
      </tr>
    `)
    .join("");

  emptyState.hidden = visibleProjects.length > 0;
  updateStats();
  saveProjects();
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function resetForm() {
  form.reset();
  projectId.value = "";
  projectProgress.value = 50;
  projectDueDate.value = new Date().toISOString().slice(0, 10);
  formTitle.textContent = "Add new project";
  document.querySelector("#saveProjectButton").textContent = "Save Project";
}

function loadProjectForEdit(project) {
  projectId.value = project.id;
  projectName.value = project.name;
  projectOwner.value = project.owner;
  projectStatus.value = project.status;
  projectProgress.value = project.progress;
  projectDueDate.value = project.dueDate;
  projectNotes.value = project.notes;
  formTitle.textContent = "Update project status";
  document.querySelector("#saveProjectButton").textContent = "Update Project";
  document.querySelector("#projectFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  projectName.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const submittedProject = {
    id: projectId.value || crypto.randomUUID(),
    name: projectName.value.trim(),
    owner: projectOwner.value.trim(),
    status: projectStatus.value,
    progress: Number(projectProgress.value),
    dueDate: projectDueDate.value,
    notes: projectNotes.value.trim(),
  };

  if (projectId.value) {
    projects = projects.map((project) => project.id === submittedProject.id ? submittedProject : project);
  } else {
    projects = [submittedProject, ...projects];
  }

  resetForm();
  renderProjects();
});

projectTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const project = projects.find((item) => item.id === button.dataset.id);
  if (!project) return;

  if (button.dataset.action === "edit") {
    loadProjectForEdit(project);
  }

  if (button.dataset.action === "delete") {
    projects = projects.filter((item) => item.id !== project.id);
    renderProjects();
  }
});

statusFilter.addEventListener("change", renderProjects);
document.querySelector("#resetFormButton").addEventListener("click", resetForm);
document.querySelector("#focusProjectForm").addEventListener("click", () => {
  resetForm();
  document.querySelector("#projectFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  projectName.focus();
});

resetForm();
renderProjects();
