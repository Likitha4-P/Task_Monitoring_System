
// Dark Mode Toggle - Initialize immediately
(function () {
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();
async function populateDepartmentFilter() {
  // Ensure departments are loaded
  if (!window._departments) {
    await renderDepartments();
  }

  const deptSelect = document.getElementById("deptFilter");
  deptSelect.innerHTML = `<option value="">All Departments</option>`;

  window._departments
    .filter(d => d.is_active === "Yes")
    .slice(1)
    .forEach(dept => {
      const opt = document.createElement("option");
      opt.value = dept.id;                    // ✅ ID
      opt.textContent = dept.department_name; // UI label
      deptSelect.appendChild(opt);
    });
}
let _facultyCache = [];

async function populateFacultyFilter() {
  _facultyCache = await loadFacultyMembers();
console.log("Faculty cache:", _facultyCache);

  const facultySelect = document.getElementById("facultyFilter");
  facultySelect.innerHTML = `<option value="">All Faculty</option>`;

  _facultyCache.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;        // ✅ user ID
    opt.textContent = f.name;
    facultySelect.appendChild(opt);
  });
}
facultyFilter.addEventListener("change", () => {
  const facultyId = facultyFilter.value;
  const deptSelect = document.getElementById("deptFilter");

  console.log("Selected faculty ID:", facultyId);

  // Reset case
  if (!facultyId) {
    deptSelect.disabled = false;
    deptSelect.value = "";
    return;
  }

  // IMPORTANT: loose equality to handle string vs number
  const faculty = _facultyCache.find(f => f.id == facultyId);

  console.log("Matched faculty:", faculty);

  if (!faculty || !faculty.department_id) {
    console.warn("Faculty has no department_id");
    return;
  }

  // 🔑 SET VALUE FIRST
  deptSelect.value = String(faculty.department_id);

  // 🔒 THEN DISABLE
  deptSelect.disabled = true;
});

document.getElementById("deptFilter").addEventListener("change", () => {
  const deptId = deptFilter.value;
  const facultySelect = document.getElementById("facultyFilter");

  facultySelect.innerHTML = `<option value="">All Faculty</option>`;

  if (!deptId) {
    _facultyCache.forEach(f => {
      facultySelect.innerHTML += `
        <option value="${f.id}">${f.name}</option>
      `;
    });
    return;
  }

  _facultyCache
    .filter(f => f.department_id == deptId)
    .forEach(f => {
      facultySelect.innerHTML += `
        <option value="${f.id}">${f.name}</option>
      `;
    });
});
function getFilterParams() {
  const params = new URLSearchParams();

  const deptId = deptFilter.value;
  const facultyId = facultyFilter.value;
  const fromDate = document.getElementById("dateFrom").value;
  const toDate = document.getElementById("dateTo").value;

  if (deptId) params.append("department_id", deptId);
  if (facultyId) params.append("faculty_id", facultyId);
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);

  return params.toString();
}

async function loadUpcomingEvents() {
    const qs = getFilterParams();
const res= await fetch(`${API_BASE}/reports/events/upcoming?${qs}`, {
  headers: getHeaders()
});

    if (!res.ok) {
        console.error("Failed to load upcoming events");
        return;
    }

    const events = await res.json();
    console.log("Upcoming events:", events);
    const container = document.getElementById("upcomingEventsList");
    container.innerHTML = "";

    if (!events.length) {
        container.innerHTML = `<p class="text-sm text-gray-500">No upcoming events</p>`;
        return;
    }

    events.forEach(ev => {
        container.innerHTML += `
      <div class="border-l-4 border-[#2b3b50] pl-3 py-2">
        <p class="font-medium text-[#2b3b50] dark:text-white">${ev.title}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${ev.department_name}</p>
        <p class="text-sm text-gray-500 mt-1">
          📅 ${new Date(ev.event_date).toDateString()}
        </p>
      </div>
    `;
    });
}
async function loadPendingApprovals() {
    const res = await fetch(`${API_BASE}/reports/events/pending`, {
      headers: getHeaders()
    });

    if (!res.ok) {
        console.error("Failed to load pending approvals");
        return;
    }

    const events = await res.json();
    console.log("Pending approvals:", events);
    const container = document.getElementById("pendingApprovalsList");
    container.innerHTML = "";

    if (!events.length) {
        container.innerHTML = `<p class="text-sm text-gray-500">No pending approvals</p>`;
        return;
    }

    events.forEach(ev => {
        container.innerHTML += `
      <div class="border-l-4 border-amber-500 pl-3 py-2">
        <p class="font-medium text-[#2b3b50] dark:text-white">${ev.title}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${ev.department_name}</p>
        <p class="text-sm text-amber-600 font-medium mt-1">⏳ Pending</p>
      </div>
    `;
    });
}
async function loadDeadlineSummary() {
    const qs = getFilterParams();
    const res = await fetch(`${API_BASE}/reports/tasks/deadlines?${qs}`,{
      headers:getHeaders()
    });

    if (!res.ok) {
        console.error("Failed to load deadlines");
        return;
    }

    const tasks = await res.json();
    const container = document.getElementById("deadlineSummaryList");
    container.innerHTML = "";

    if (!tasks.length) {
        container.innerHTML = `<p class="text-sm text-gray-500">No upcoming deadlines</p>`;
        return;
    }

    tasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const today = new Date();

        const isOverdue = deadline < today;
        const borderColor = isOverdue ? "border-red-500" : "border-amber-500";
        const textColor = isOverdue ? "text-red-600" : "text-amber-600";
        const statusText = isOverdue ? "⚠️ Overdue" : "⏰ Due Soon";

        container.innerHTML += `
      <div class="border-l-4 ${borderColor} pl-3 py-2">
        <p class="font-medium text-[#2b3b50] dark:text-white">${task.title}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${task.course_name || ""}</p>
        <p class="text-sm ${textColor} font-medium mt-1">${statusText}</p>
      </div>
    `;
    });
}

// Set default dates
const today = new Date();
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
document.getElementById('dateFrom').valueAsDate = weekAgo;
document.getElementById('dateTo').valueAsDate = today;

function applyFilters() {
    loadUpcomingEvents();
    loadPendingApprovals();
    loadDeadlineSummary();
    
}

function resetFilters() {
  deptFilter.value = "";
  deptFilter.disabled = false;

  facultyFilter.value = "";

  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";

  applyFilters();
  populateFacultyFilter();
}

async function exportPDF() {
  const reportData = await exportReport();

  const facultyId = facultyFilter.value;
  const isFacultySelected = Boolean(facultyId);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let y = 15;

  /* ---------------- HEADER ---------------- */
  doc.setFontSize(18);
  doc.text("College Management System", 14, y);
  y += 8;

  doc.setFontSize(14);
  doc.text("Reporting & Analytics", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(
    `Report Period: ${dateFrom.value || "-"} to ${dateTo.value || "-"}`,
    14,
    y
  );
  y += 10;

  /* ---------------- SUMMARY ---------------- */
  doc.setFontSize(14);
  doc.text("Summary", 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    head: [["Metric", "Count"]],
    body: [
      ["Total Events", reportData.summary.totalEvents],
      ["Pending Approvals", reportData.summary.pendingApprovals],
      ["Upcoming Deadlines", reportData.summary.upcomingDeadlines],
      ["Overdue Items", reportData.summary.overdueItems],
      ["Completed Tasks", reportData.summary.completedTasks]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [43, 59, 80] }
  });

  y = doc.lastAutoTable.finalY + 10;

  /* ---------------- EVENTS ---------------- */
  doc.setFontSize(14);
  doc.text("Events", 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    head: [["Event Name", "Department", "Date", "Status", "Attendees"]],
    body: reportData.events.map(e => [
      e.name,
      e.department,
      e.date,
      e.status,
      e.attendees
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [43, 59, 80] }
  });

  y = doc.lastAutoTable.finalY + 10;

  /* ---------------- TASKS & DEADLINES ---------------- */
  doc.setFontSize(14);
  doc.text("Tasks & Deadlines", 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    head: [["Task", "Course", "Due Date", "Status", "Priority"]],
    body: reportData.tasks.map(t => [
      t.task,
      t.course,
      t.dueDate,
      t.status,
      t.priority
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [43, 59, 80] }
  });

  y = doc.lastAutoTable.finalY + 10;

  /* ---------------- FACULTY PERFORMANCE (ONLY IF NO FACULTY FILTER) ---------------- */
  if (!isFacultySelected) {
    doc.setFontSize(14);
    doc.text("Faculty Performance", 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [["Faculty Name", "Department", "Tasks Assigned", "Events Organized"]],
      body: reportData.faculty.map(f => [
        f.name,
        f.department,
        f.tasksAssigned,
        f.eventsOrganized
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [43, 59, 80] }
    });
  }

  /* ---------------- SAVE ---------------- */
  doc.save("college-report.pdf");
}

async function exportExcel() {
  const reportData = await exportReport();

  const wb = XLSX.utils.book_new();

  const eventsSheet = XLSX.utils.json_to_sheet(reportData.events);
  const tasksSheet = XLSX.utils.json_to_sheet(reportData.tasks);
  const facultySheet = XLSX.utils.json_to_sheet(reportData.faculty);

  XLSX.utils.book_append_sheet(wb, eventsSheet, "Events");
  XLSX.utils.book_append_sheet(wb, tasksSheet, "Tasks");
  XLSX.utils.book_append_sheet(wb, facultySheet, "Faculty Summary");

  XLSX.writeFile(wb, "college-report.xlsx");
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-[#2b3b50] text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}
function exportReport() {
  const qs = getFilterParams();
  return fetch(`${API_BASE}/reports/export?${qs}`,{headers:getHeaders()})
    .then(res => res.json());
}
