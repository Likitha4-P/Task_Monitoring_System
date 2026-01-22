
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
    const res = await fetch(`${API_BASE}/reports/events/upcoming?${qs}`);

    if (!res.ok) {
        console.error("Failed to load upcoming events");
        return;
    }

    const events = await res.json();
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
    const res = await fetch(`${API_BASE}/reports/events/pending`);

    if (!res.ok) {
        console.error("Failed to load pending approvals");
        return;
    }

    const events = await res.json();
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
    const res = await fetch(`${API_BASE}/reports/tasks/deadlines?${qs}`);

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


// Dummy Data for Reports
const reportData = {
    summary: {
        totalEvents: 15,
        pendingApprovals: 8,
        upcomingDeadlines: 12,
        overdueItems: 3,
        completedTasks: 45
    },
    events: [
        { id: 1, name: 'Tech Symposium 2026', department: 'Computer Science & Engineering', date: '2026-01-25', status: 'Scheduled', attendees: 250 },
        { id: 2, name: 'Annual Sports Day', department: 'Physical Education', date: '2026-02-02', status: 'Scheduled', attendees: 500 },
        { id: 3, name: 'Research Conference', department: 'All Departments', date: '2026-02-10', status: 'Scheduled', attendees: 180 },
        { id: 4, name: 'Industrial Visit', department: 'Mechanical Engineering', date: '2026-01-28', status: 'Pending Approval', attendees: 60 },
        { id: 5, name: 'Guest Lecture Series', department: 'Electronics & Communication', date: '2026-02-05', status: 'Pending Approval', attendees: 120 },
        { id: 6, name: 'Workshop on AI', department: 'Computer Science & Engineering', date: '2026-01-30', status: 'Approved', attendees: 80 },
        { id: 7, name: 'Cultural Fest', department: 'Student Affairs', date: '2026-03-15', status: 'Scheduled', attendees: 600 },
        { id: 8, name: 'Blood Donation Camp', department: 'NSS', date: '2026-02-20', status: 'Approved', attendees: 150 },
        { id: 9, name: 'Hackathon 2026', department: 'Computer Science & Engineering', date: '2026-03-01', status: 'Pending Approval', attendees: 200 },
        { id: 10, name: 'Career Fair', department: 'Placement Cell', date: '2026-02-25', status: 'Scheduled', attendees: 400 }
    ],
    tasks: [
        { id: 1, task: 'Assignment Submission', course: 'Data Structures', dueDate: '2026-01-18', status: 'Overdue', priority: 'High' },
        { id: 2, task: 'Lab Report Submission', course: 'Physics Laboratory', dueDate: '2026-01-22', status: 'Pending', priority: 'Medium' },
        { id: 3, task: 'Project Proposal', course: 'Final Year Project', dueDate: '2026-01-15', status: 'Completed', priority: 'High' },
        { id: 4, task: 'Mid-term Exam Preparation', course: 'Database Management', dueDate: '2026-01-26', status: 'Pending', priority: 'High' },
        { id: 5, task: 'Research Paper Review', course: 'Machine Learning', dueDate: '2026-01-24', status: 'Pending', priority: 'Medium' },
        { id: 6, task: 'Code Review', course: 'Software Engineering', dueDate: '2026-01-19', status: 'Overdue', priority: 'High' },
        { id: 7, task: 'Presentation Slides', course: 'Computer Networks', dueDate: '2026-01-27', status: 'Pending', priority: 'Low' },
        { id: 8, task: 'Case Study Analysis', course: 'Management', dueDate: '2026-01-23', status: 'Pending', priority: 'Medium' },
        { id: 9, task: 'Quiz Preparation', course: 'Operating Systems', dueDate: '2026-01-21', status: 'Completed', priority: 'Low' },
        { id: 10, task: 'Group Discussion', course: 'Communication Skills', dueDate: '2026-01-25', status: 'Pending', priority: 'Low' }
    ],
    faculty: [
        { name: 'Dr. Smith Johnson', department: 'Computer Science & Engineering', tasksAssigned: 15, eventsOrganized: 3 },
        { name: 'Prof. Maria Garcia', department: 'Electronics & Communication', tasksAssigned: 12, eventsOrganized: 2 },
        { name: 'Dr. Rajesh Kumar', department: 'Mechanical Engineering', tasksAssigned: 10, eventsOrganized: 4 },
        { name: 'Prof. Sarah Williams', department: 'Civil Engineering', tasksAssigned: 8, eventsOrganized: 1 },
        { name: 'Dr. Ahmed Hassan', department: 'Computer Science & Engineering', tasksAssigned: 14, eventsOrganized: 2 }
    ]
};

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
  return fetch(`${API_BASE}/reports/export?${qs}`)
    .then(res => res.json());
}
