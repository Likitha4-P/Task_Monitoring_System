const API_BASE = "http://localhost:5000/api";
let authToken = localStorage.getItem("token") || null;
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let currentUserid = currentUser?.id || null;

function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getHeaders() {
  return authToken
    ? { "Content-Type": "application/json", "Authorization": "Bearer " + authToken }
    : { "Content-Type": "application/json" };
}
// ---- Login ----
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Login failed:", data.message);
      alert(data.message || "Login failed");
      return;
    }


    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/dashboard.html"; // ✅ Redirect

  } catch (error) {
    console.error("Network error:", error);
    alert("Unable to connect to server");
  }

}

function toggleVisibility(showId) {

  document.querySelectorAll(".page").forEach(el => {
    el.style.display = "none"; // hide all pages
  });

  const showEl = document.getElementById(showId);
  if (showEl) {
    showEl.style.display = "block"; // show selected page
    console.log(`Showing: ${showId}`);
  } else {
    console.warn(`❌ Element with ID "${showId}" not found`);
  }
}
// ---- Dark Mode Toggle ----
function initDarkModeToggle() {
  // Select ALL dark toggle buttons and add click listeners
  document.querySelectorAll('.darkToggle').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Dark mode toggled");
      document.documentElement.classList.toggle('dark');
      // Save preference to localStorage
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    });
  });
}

// Load dark mode preference on page load
function loadDarkModePreference() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}

// ---- Tasks ----

// ---- Tasks ----
async function loadTasks() {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: getHeaders(),
    cache: "no-store"
  });

  if (!res.ok) return alert("Failed to load tasks");

  const tasks = await res.json();

  // Filter tasks based on role
  let filteredTasks = tasks;

  if (currentUser?.role === "Faculty" || currentUser?.role === "Faculty/File Incharge") {
    // Faculty only sees tasks assigned to them
    filteredTasks = tasks.filter(task => task.assigned_to === currentUser.id);
  } else if (currentUser?.role === "Department Head" || currentUser?.role === "Professor Incharge") {
    // Department Head sees tasks in their department
    filteredTasks = tasks.filter(task => task.department_id === currentUser.department_id);
  }
  // Admin sees all tasks, no filtering needed

  const container = document.getElementById("taskrows");
  if (!container) return;
  container.innerHTML = "";
  const tableHead = document.getElementById("taskTableHeader");

  // ✅ Update the table header dynamically
 tableHead.innerHTML = `
  <tr>
    <th>Title</th>
    <th>Description</th>
    ${currentUser?.role === "Faculty/File Incharge" ? "" : "<th>Assigned To</th>"}
    <th>Department</th>
    <th>Priority</th>
    <th>Due Date</th>
    <th>Status</th>
    <th>Actions</th>
  </tr>
`;
  const tableBody = document.getElementById("taskrows");
  tableBody.innerHTML = ""; // Reset table before rendering

  for (const task of filteredTasks) {
    const row = document.createElement("tr");

    // ✅ Status dropdown for Professor Incharge only
    let statusDropdown = "";
    if (currentUser?.role === "Professor Incharge") {
      statusDropdown = `
        <select 
          onchange="updateTaskStatus(${task.id}, this.value)"
          style="padding:3px;border-radius:5px;cursor:pointer;">
          <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Submitted" ${task.status === "Submitted" ? "selected" : ""}>Submitted</option>
          <option value="Verified" ${task.status === "Verified" ? "selected" : ""}>Verified</option>
          <option value="Closed" ${task.status === "Closed" ? "selected" : ""}>Closed</option>
        </select>
      `;
    } else {
      statusDropdown = `<span style="font-weight:bold;">${task.status}</span>`;
    }

    // ✅ Progress bar or range slider for assignees
    let progressSection = "";
    if (currentUser?.id === task.assigned_to) {
      progressSection = `
        <div style="display:flex;align-items:center;gap:8px;">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value="${task.progress}"
            oninput="document.getElementById('progressLabel-${task.id}').innerText = this.value + '%'"
            onchange="updateTaskProgress(${task.id}, this.value)"
            style="cursor:pointer;width:120px;"
          >
          <span id="progressLabel-${task.id}" style="font-weight:bold;">
            ${task.progress}%
          </span>
        </div>
      `;
    } else {
      progressSection = `${task.progress}%`;
    }

    // ✅ Actions column logic
    let actions = "";
    if (currentUser?.role === "Admin") {
      actions = `
        <div style="display:flex;align-items:center;gap:8px;flex-direction:column">
          <span style="color:green;">${progressSection} completed</span>
          <div class="tasks-action-buttons">
            <button class="tasks-btn-edit" onclick="editTask('${task.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="tasks-btn-delete" onclick="deleteTask('${task.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    } else if (currentUser?.role === "Professor Incharge") {
      actions = `
        <div class="tasks-action-buttons">
          ${statusDropdown}
          ${progressSection}
        </div>
      `;
    } else if (currentUser?.role === "Faculty/File Incharge") {
      actions = `
        <div class="tasks-action-buttons">
          ${progressSection}
        </div>
      `;
    } else {
      actions = `
        <div class="tasks-action-buttons" style="color:gray;">
          View Only
        </div>
      `;
    }

    // ✅ Build the row using new schema fields
      row.innerHTML = `
      <td class="text-slate-700 p-3 dark:text-slate-200">${task.title}</td>
      <td class="text-slate-700 p-3 dark:text-slate-200">${task.description || ""}</td>
      ${currentUser?.role === "Faculty/File Incharge" ? "" : `<td class="text-slate-700 p-3 dark:text-slate-200">${task.assignee_name || "Unassigned"}</td>`}
      <td class="text-slate-700 p-3 dark:text-slate-200">${task.department_name || "N/A"}</td>
      <td class="text-slate-700 p-3 dark:text-slate-200">${task.priority}</td>
      <td class="text-slate-700 p-3 dark:text-slate-200">${formatDate(task.deadline)}</td>
      <td class="text-slate-700 p-3 dark:text-slate-200">${statusDropdown}</td>
      <td class="text-slate-700 p-3 dark:text-slate-200">${actions}</td>
    `;
        row.className = "border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700";

    tableBody.appendChild(row);
  }
}


// Fetch task by ID
async function getTaskById(taskId) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch task");
    return await res.json();
  } catch (err) {
    console.error("Error fetching task:", err);
    return null;
  }
}

// Open modal with task data for editing
async function editTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task) return alert("Task not found");

  const facultyMembers = await loadFacultyMembers();
  populateFacultyDropdown(facultyMembers);


  // Fill other form fields
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value = task.description;
  document.getElementById("taskDueDate").value = task.deadline.split("T")[0];
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskAssignedTo").value = task.assigned_to;
  document.getElementById("hiddenAssignedTo").value = task.assigned_to;
  const assignedToSelect = document.getElementById("taskAssignedTo");
  const assignedToLabel = document.getElementById("taskAssignedToLabel");

  // Hide the field visually
  assignedToSelect.style.display = "none";
  assignedToLabel.style.display = "none";

  // Disable to skip validation
  assignedToSelect.disabled = true;

  // Set form mode to edit
  const form = document.getElementById("createTaskForm");
  form.dataset.mode = "edit";
  form.dataset.taskId = taskId;

  document.querySelector(".tasks-modal-header h2").innerHTML =
    '<i class="fas fa-edit"></i> Edit Task';
  document.querySelector(".tasks-btn-submit").textContent = "Update Task";

  openTaskModal();
}


// Update task (PUT)
async function updateTask(taskId) {
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const deadline = document.getElementById("taskDueDate").value;
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;
  const assigned_to = document.getElementById("hiddenAssignedTo").value;
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ title, description, deadline, priority, status, assigned_to })
  });

  if (!res.ok) return alert("Failed to update task");
  alert("Task updated!");
  closeTaskModal();
  loadTasks();
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "DELETE",
    headers: getHeaders()
  });

  if (!res.ok) return alert("Failed to delete task");
  alert("Task deleted!");
  loadTasks();
}


async function updateTaskProgress(taskId, progress) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/progress`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ progress: Number(progress) })
  });
  if (!res.ok) return alert("Failed to update progress");
  await loadTasks();
}
// ✅ Update Task Status (Professor Incharge Only)
async function updateTaskStatus(taskId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(errorData.message || "Failed to update status");
      return;
    }

    alert("✅ Task status updated successfully!");
    loadTasks(); // Refresh the tasks table
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Something went wrong. Please try again.");
  }
}



// ---- Tasks: Create ----
async function loadFacultyMembers() {
  const users = await loadUsers();
  return users.filter(u =>
    ["Faculty/File Incharge"].includes(u.role)
  );
}

async function openTaskModal() {
  document.getElementById('createTaskModal').style.display = 'block';
  document.body.style.overflow = 'hidden';

  const users = await loadUsers();

  // ✅ Only include Faculty/File Incharge (adjust roles if needed)
  const facultyMembers = users.filter(u =>
    ["Faculty/File Incharge"].includes(u.role)
  );

  console.log("Faculty Members:", facultyMembers);

  populateFacultyDropdown(facultyMembers);
}


function closeTaskModal() {
  document.getElementById('createTaskModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('createTaskForm').reset();

  document.getElementById("hiddenAssignedTo").value = "";
  // Reset form state
  const assignedToSelect = document.getElementById("taskAssignedTo");
  const assignedToLabel = document.getElementById("taskAssignedToLabel");

  assignedToSelect.style.display = "block";
  assignedToLabel.style.display = "block";

  assignedToSelect.disabled = false;
  assignedToSelect.required = true; // Optional: if needed for create mode
  delete document.getElementById('createTaskForm').dataset.editingRow;
  document.querySelector('.tasks-modal-header h2').innerHTML = '<i class="fas fa-plus-circle"></i> Create New Task';
  document.querySelector('.tasks-btn-submit').textContent = 'Create Task';
}

// ---- Modal Close Handler (All Modals) ----
window.onclick = function (event) {
  const modals = [
    { modal: document.getElementById('createTaskModal'), close: closeTaskModal },
    { modal: document.getElementById('proposeEventModal'), close: closeEventModal },
    { modal: document.getElementById('createUserModal'), close: closeModal }
  ];
  modals.forEach(({ modal, close }) => {
    if (modal && event.target === modal) close();
  });
};

// Function to populate faculty dropdown
function populateFacultyDropdown(facultyMembers) {
  const select = document.getElementById('taskAssignedTo');
  // Reset dropdown
  select.innerHTML = '<option id="selected" value="">Select faculty member</option>';

  if (!facultyMembers || facultyMembers.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.disabled = true;
    option.textContent = "No faculty available";
    select.appendChild(option);
    return;
  }

  // Add filtered faculty
  facultyMembers.forEach(faculty => {
    const option = document.createElement('option');
    option.value = faculty.id; // better to store id, not just name
    option.textContent = `${faculty.name} (${faculty.department})`;
    option.setAttribute('id', faculty.id); // set id for easy access later
    select.appendChild(option);
  });
}



async function createTask(event) {
  event.preventDefault();


  const faculty = await getUserById(document.getElementById("taskAssignedTo").value);
  console.log(faculty.department);
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const deadline = document.getElementById("taskDueDate").value;
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;
  const assigned_to = document.getElementById("taskAssignedTo").value;
  const department = faculty.department;

  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, description, deadline, priority, status, assigned_to, department })
  });

  if (!res.ok) return alert("Failed to create task");
  alert("Task created!");
  document.getElementById("createTaskForm").reset();
  loadTasks();
}

// ---- Events ----

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
async function loadEvents() {
  const res = await fetch(`${API_BASE}/events`, { headers: getHeaders() });
  if (!res.ok) return alert("Failed to load events");
  const events = await res.json();

  const container = document.getElementById("eventRows");
  if (!container) return;
  container.innerHTML = "";
  for (const ev of events) {
    const tr = document.createElement("tr");

    const createdby = await getUserById(ev.created_by);
    console.log(createdby)

    tr.className = "calendar-event " + ev.status.toLowerCase();
    tr.innerHTML = `
      <td>${ev.title}</td>
      <td>${ev.department}</td>
      <td>${formatDate(ev.created_at)}</td>
      <td>${formatDate(ev.date)}</td>
      <td>${ev.participants}</td>
      <td><span class="events-status-badge events-status-${ev.status.toLowerCase()}">${ev.status}</span></td>
      <td>${createdby.name}</td>
      <td>
      ${currentUser?.role === "Admin"
        ? ev.status === 'Approved'
          ? `<div class="events-action-buttons">
          <button class="events-btn-edit" disabled style="opacity:0.5;cursor:not-allowed">
            <i class="fas fa-edit"></i> Approve
          </button>
          <button class="events-btn-delete" disabled style="opacity:0.5;cursor:not-allowed">
            <i class="fas fa-trash"></i> Reject
          </button>
          </div>`
          : `<div class="events-action-buttons">
          <button class="events-btn-edit" onclick="approveEvent('${ev.id}')">
            <i class="fas fa-edit"></i> Approve
          </button>
          <button class="events-btn-delete" onclick="rejectEvent('${ev.id}')">
            <i class="fas fa-trash"></i> Reject
          </button>
          </div>`
        : `<span style="color:gray;">View Only</span>`
      }
      </td>
    `;
    container.appendChild(tr);

    if (ev.status === "Approved") {
      addApprovedEventToCalendar({
        title: ev.title,
        date: formatForCalendar(ev.date), // ensure proper format
        department: ev.department,
        participants: ev.participants,
        createdBy: createdby?.name || "-"
      });
    }

  }
  //   for (const ev of events) {
  //   if (ev.status === "Approved") {
  //     const createdby = await getUserById(ev.created_by);

  //     // Push into FullCalendar
  //     addApprovedEventToCalendar({
  //       title: ev.title,
  //       date: ev.date,  // must be YYYY-MM-DD
  //       department: ev.department,
  //       participants: ev.participants,
  //       createdBy: createdby?.name || "-"
  //     });
  //   }
  // }

}

// helper to ensure FullCalendar accepts the date
function formatForCalendar(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0];// YYYY-MM-DD
}
async function approveEvent(id, title, date, department, participants, createdBy) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/approve`, {
      method: "PUT",
      headers: getHeaders()
    });
    if (!res.ok) return alert("Failed to approve event");

    // ✅ Update table status badge
    const row = document.querySelector(`#eventRows tr td span.events-status-badge`);
    if (row) row.innerText = "Approved";

    // ✅ Add to calendar
    addApprovedEventToCalendar({
      title: title,
      date: formatForCalendar(date),
      department: department,
      participants: participants,
      createdBy: createdBy
    });

    alert("✅ Event Approved and added to calendar!");
  } catch (err) {
    console.error(err);
    alert("Error approving event");
  }
}

async function rejectEvent(id) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/reject`, {
      method: "PUT",
      headers: getHeaders()
    });
    if (!res.ok) return alert("Failed to reject event");

    // ✅ Update table status badge
    const row = document.querySelector(`#eventRows tr td span.events-status-badge`);
    if (row) row.innerText = "Rejected";

    alert("❌ Event Rejected!");
  } catch (err) {
    console.error(err);
    alert("Error rejecting event");
  }
}

function openEventModal() {
  document.getElementById('proposeEventModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeEventModal() {
  document.getElementById('proposeEventModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('proposeEventForm').reset();

  // Reset form state
  delete document.getElementById('proposeEventForm').dataset.editingRow;
  document.querySelector('.events-modal-header h2').innerHTML = '<i class="fas fa-calendar-plus"></i> Propose New Event';
  document.querySelector('.events-btn-submit').textContent = 'Propose Event';
}

async function createEvent() {
  const title = document.getElementById("eventTitle").value;
  const department = document.getElementById("eventDepartment").value;
  const date = document.getElementById("eventDate").value;
  const participants = document.getElementById("eventParticipants").value;

  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, department, date, participants })
  });

  if (!res.ok) return alert("Failed to create event");
  alert("Event created!");
  closeEventModal();
  loadEvents();
}


async function approveEvent(id) {
  await fetch(`${API_BASE}/events/${id}/approve`, { method: "POST", headers: getHeaders() });
  loadEvents();
}
async function rejectEvent(id) {
  await fetch(`${API_BASE}/events/${id}/reject`, { method: "POST", headers: getHeaders() });
  loadEvents();
}


function generateTaskReport() {
  // Create PDF content
  const pdfContent = `
COLLEGE TASK MONITORING SYSTEM
Task Status Report
Generated on: ${new Date().toLocaleDateString()}

=== TASK SUMMARY ===
Total Tasks: 40
Pending: 12 (30%)
In Progress: 5 (12.5%)
Completed: 20 (50%)
Overdue: 3 (7.5%)

=== DEPARTMENT BREAKDOWN ===
Computer Science:
- Total Tasks: 15
- Completed: 8
- In Progress: 3
- Pending: 3
- Overdue: 1

Information Technology:
- Total Tasks: 12
- Completed: 7
- In Progress: 2
- Pending: 2
- Overdue: 1

Mathematics:
- Total Tasks: 8
- Completed: 3
- In Progress: 0
- Pending: 4
- Overdue: 1

Physics:
- Total Tasks: 5
- Completed: 2
- In Progress: 0
- Pending: 3
- Overdue: 0

=== FACULTY WORKLOAD ANALYSIS ===
Faculty X: 5 tasks (3 completed, 1 in progress, 1 pending)
Dr. John Smith: 4 tasks (2 completed, 1 in progress, 1 pending)
Prof. Sarah Johnson: 3 tasks (3 completed, 0 in progress, 0 pending)
Dr. Mike Wilson: 6 tasks (4 completed, 1 in progress, 1 overdue)

=== DEADLINE COMPLIANCE ===
On-time completion rate: 85%
Average completion time: 12 days
Tasks completed before deadline: 17/20

=== PRIORITY ANALYSIS ===
High Priority: 8 tasks (6 completed, 1 in progress, 1 overdue)
Medium Priority: 20 tasks (12 completed, 3 in progress, 5 pending)
Low Priority: 12 tasks (2 completed, 1 in progress, 6 pending, 3 overdue)

=== RECOMMENDATIONS ===
1. Focus on overdue high-priority tasks
2. Redistribute workload for Faculty with 6+ tasks
3. Implement early warning system for approaching deadlines
4. Provide additional support for Mathematics department

Report generated by College Task Monitoring System
Contact: admin@college.edu for queries
            `;

  // Create and download PDF-like text file
  const blob = new Blob([pdfContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Task_Status_Report_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  alert('📊 Task Status Report downloaded successfully!\n\nFile: Task_Status_Report_' + new Date().toISOString().split('T')[0] + '.txt\n\nThe report includes comprehensive task analytics, department breakdowns, and faculty workload analysis.');
}

function generateDeadlineReport() {
  // Create Excel-like CSV content
  const csvContent = `Task ID,Task Name,Assigned To,Department,Deadline,Days Remaining,Priority,Status,Progress
TSK001,NAAC Accreditation File,Faculty X,Computer Science,2025-09-10,3,High,In Progress,50%
TSK002,Syllabus File Update,Prof. Johnson,Mathematics,2025-09-15,8,Medium,Verified,100%
TSK003,Student Attendance Report,Dr. Smith,Computer Science,2025-09-20,13,Low,Submitted,100%
TSK004,Lab Equipment Inventory,Dr. Wilson,Physics,2025-09-08,1,High,Pending,0%
TSK005,Course Outcome Analysis,Faculty Y,Information Technology,2025-09-12,5,Medium,In Progress,75%
TSK006,Research Paper Review,Prof. Davis,Mathematics,2025-09-18,11,Low,Pending,0%
TSK007,Student Feedback Analysis,Faculty Z,Computer Science,2025-09-14,7,Medium,In Progress,25%
TSK008,Library Book Audit,Librarian,Administration,2025-09-16,9,Low,Pending,0%
TSK009,Exam Schedule Preparation,Dr. Brown,Administration,2025-09-11,4,High,In Progress,80%
TSK010,Faculty Performance Review,Principal,Management,2025-09-25,18,Medium,Pending,0%
TSK011,Infrastructure Maintenance,Maintenance Head,Administration,2025-09-09,2,High,Overdue,0%
TSK012,Student Placement Report,Placement Officer,Administration,2025-09-22,15,Medium,Pending,0%
TSK013,Budget Allocation Review,Finance Head,Administration,2025-09-13,6,High,In Progress,60%
TSK014,Academic Calendar Update,Academic Head,Administration,2025-09-17,10,Medium,Pending,0%
TSK015,Quality Assurance Audit,QA Team,Administration,2025-09-19,12,High,Pending,0%

SUMMARY STATISTICS:
Total Tasks Due in Next 30 Days: 15
Overdue Tasks: 1
High Priority Tasks: 6
Medium Priority Tasks: 6
Low Priority Tasks: 3
Average Days to Deadline: 8.2
Tasks at Risk (Due in 3 days): 3

DEPARTMENT WISE BREAKDOWN:
Computer Science: 3 tasks
Mathematics: 2 tasks
Information Technology: 1 task
Physics: 1 task
Administration: 8 tasks

PRIORITY ANALYSIS:
High Priority Overdue: 1
Medium Priority Due Soon: 2
Low Priority Delayed: 1`;

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Deadline_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  alert('📈 Deadline Summary Report downloaded successfully!\n\nFile: Deadline_Summary_Report_' + new Date().toISOString().split('T')[0] + '.csv\n\nOpen with Excel or Google Sheets for detailed analysis. Includes task deadlines, priority breakdown, and department-wise statistics.');
}

function generateEventReport() {
  // Create iCal format calendar content
  const calendarContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//College Task Monitoring System//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH

BEGIN:VEVENT
UID:evt001@college.edu
DTSTART:20250910T090000Z
DTEND:20250910T170000Z
SUMMARY:Workshop on Artificial Intelligence
DESCRIPTION:Comprehensive workshop on AI technologies and applications. Resource persons: Industry Expert, Prof. Smith. Expected participants: 75.
LOCATION:Tech Lab, Main Building
STATUS:CONFIRMED
CATEGORIES:WORKSHOP,COMPUTER SCIENCE
PRIORITY:5
END:VEVENT

BEGIN:VEVENT
UID:evt002@college.edu
DTSTART:20250912T100000Z
DTEND:20250912T160000Z
SUMMARY:Guest Lecture on Cloud Computing
DESCRIPTION:Expert lecture on cloud technologies and future trends. Resource person: Cloud Computing Expert. Expected participants: 60.
LOCATION:Conference Hall, IT Block
STATUS:CONFIRMED
CATEGORIES:LECTURE,INFORMATION TECHNOLOGY
PRIORITY:5
END:VEVENT

BEGIN:VEVENT
UID:evt003@college.edu
DTSTART:20250915T090000Z
DTEND:20250915T170000Z
SUMMARY:Web Development Workshop
DESCRIPTION:Hands-on workshop on modern web development technologies. Resource persons: Industry Expert, Faculty Team. Expected participants: 50.
LOCATION:Main Auditorium
STATUS:TENTATIVE
CATEGORIES:WORKSHOP,COMPUTER SCIENCE
PRIORITY:3
END:VEVENT

BEGIN:VEVENT
UID:evt004@college.edu
DTSTART:20250918T140000Z
DTEND:20250918T170000Z
SUMMARY:Mathematics Symposium
DESCRIPTION:Annual mathematics symposium with research presentations. Resource persons: Mathematics Faculty. Expected participants: 40.
LOCATION:Mathematics Department
STATUS:CONFIRMED
CATEGORIES:SYMPOSIUM,MATHEMATICS
PRIORITY:4
END:VEVENT

BEGIN:VEVENT
UID:evt005@college.edu
DTSTART:20250920T100000Z
DTEND:20250920T150000Z
SUMMARY:Physics Lab Demonstration
DESCRIPTION:Advanced physics experiments demonstration for students. Resource persons: Physics Faculty. Expected participants: 30.
LOCATION:Physics Laboratory
STATUS:CONFIRMED
CATEGORIES:DEMONSTRATION,PHYSICS
PRIORITY:4
END:VEVENT

BEGIN:VEVENT
UID:evt006@college.edu
DTSTART:20250922T090000Z
DTEND:20250922T120000Z
SUMMARY:Career Guidance Session
DESCRIPTION:Career counseling and placement guidance for final year students. Resource persons: Placement Team. Expected participants: 100.
LOCATION:Main Auditorium
STATUS:CONFIRMED
CATEGORIES:GUIDANCE,PLACEMENT
PRIORITY:5
END:VEVENT

END:VCALENDAR`;

  // Create and download iCal file
  const blob = new Blob([calendarContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `College_Event_Calendar_${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  alert('📅 Event Calendar downloaded successfully!\n\nFile: College_Event_Calendar_' + new Date().toISOString().split('T')[0] + '.ics\n\nImport this file into Google Calendar, Outlook, or any calendar application to view all college events. Includes approved events, pending proposals, and detailed event information.');
}
// ================= USERS =================
// Load all users 
async function loadUsers() {
  const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
  if (!res.ok) {
    alert("Failed to load users");
    return []; // return empty array instead of undefined
  }

  const users = await res.json();

  const container = document.getElementById("tableRows");
  if (!container) return users;
  container.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.department}</td>
      <td>
        ${currentUser?.role === "Admin"
        ? `<div class="action-buttons">
                <button class="btn-edit" onclick="editUser('${u.id}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteUser('${u.id}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
             </div>`
        : `<span style="color:gray;">View Only</span>`}
      </td>
    `;
    container.appendChild(tr);
  });

  return users; // ✅ return array so openTaskModal() can use it
}

async function loadDepartmentsForUserForm() {
  const select = document.getElementById("userDepartment");
  select.innerHTML = `<option value="">Select department</option>`;

  const res = await fetch(`${API_BASE}/departments`);
  const departments = await res.json();

  departments
    .filter(d => d.is_active === "Yes")
    .forEach(d => {
      const option = document.createElement("option");
      option.value = d.id; // ✅ department_id
      option.textContent = `${d.department_code} - ${d.department_name}`;
      select.appendChild(option);
    });
}

async function openEditUserModal(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      alert("Failed to fetch user details");
      return;
    }

    const user = await res.json();

    const form = document.getElementById("createUserForm");

    // Switch to edit mode
    form.dataset.mode = "edit";
    form.dataset.userId = user.id;

    // Auto-fill fields
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userRole").value = user.role;

    // Password stays empty
    document.getElementById("userPass").value = "";

    // Change submit text
    document.querySelector("#createUserForm .btn-submit").textContent =
      "Update User";

    openModal();
  } catch (err) {
    console.error(err);
    alert("Error loading user");
  }
}


// Open/close modal
function openModal() {

     if (currentDepartment) {
    document.getElementById("userDepartmentDisplay").value =
      `${currentDepartment.department_code} - ${currentDepartment.department_name}`;
  }

  document.getElementById('userEmail').value = "";
  document.getElementById('userPass').value = "";
  document.getElementById('createUserModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const form = document.getElementById("createUserForm");
  form.reset();

  delete form.dataset.mode;
  delete form.dataset.userId;

  document.querySelector("#createUserForm .btn-submit").textContent =
    "Create User";

  document.getElementById("createUserModal").style.display = "none";
  document.body.style.overflow = "auto";
}


// Create user
async function createUser() {
  if (!currentDepartment) {
    alert("No department selected");
    return;
  }

  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPass").value;
  const role = document.getElementById("userRole").value;
  const contact = document.getElementById("userContact").value.trim();
  if (!/^\d+$/.test(contact)) {
    alert("Contact must contain only numbers");
    return;
  }
  

  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      email,
      password,
      role,
      department_id: currentDepartment.id, // ✅ AUTO-FILLED
      contact,
      status: "Active"
    })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message || "Failed to create user");
    return;
  }

  alert("User created successfully!");
  closeModal();
  loadDepartmentUsers(currentDepartment.id); // refresh table
}


// Delete user
async function deleteUser(id) {
  if (!confirm("Are you sure?\nAll the events or tasks assigned to this user will also be deleted!")) return;
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  // Get tasks assigned to this user
  const tasksRes = await fetch(`${API_BASE}/tasks?assigned_to=${id}`, {
    headers: getHeaders()
  });

  if (!tasksRes.ok) {
    console.error("Failed to get user's tasks");
    return;
  }

  const tasks = await tasksRes.json();

  // Only attempt delete if there are assigned tasks
  if (tasks.length > 0) {
    const deleteRes = await fetch(`${API_BASE}/tasks?assigned_to=${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    if (!deleteRes.ok) {
      console.error("Failed to delete user's tasks");
      return;
    }
  }
  // Get events created by this user
  const eventsRes = await fetch(`${API_BASE}/events?created_by=${id}`, {
    headers: getHeaders()
  });

  if (!eventsRes.ok) {
    console.error("Failed to get user's events");
    return;
  }

  const events = await eventsRes.json();

  // Only attempt delete if there are events
  if (events.length > 0) {
    const deleteRes = await fetch(`${API_BASE}/events?created_by=${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    if (!deleteRes.ok) {
      console.error("Failed to delete user's events");
      return;
    }
  }
  if (!res.ok) return alert("Failed to delete user");
  loadUsers();
}

// Get user by ID
async function getUserById(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}

// Update user
async function updateUser(userId) {
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const role = document.getElementById("userRole").value;

  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      email, // ✅ INCLUDED
      role,
      status: "Active"
    })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message || "Failed to update user");
    return;
  }

  alert("User updated successfully!");
  closeModal();
  loadDepartmentUsers(currentDepartment.id);
}
// ================= DEPARTMENTS =================
const departmentGrid = document.getElementById("departmentGrid");
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-department-id]");
  if (!card) return;

  const depId = card.dataset.departmentId;
  console.log("Delegated click:", depId);

  // Find department object
  const dep = window._departments.find(d => d.id == depId);
  if (dep) openDepartment(dep);
});

async function renderDepartments() {
  try {
    const response = await fetch("http://localhost:5000/api/departments");
    const departments = await response.json();
window._departments = departments;
    // ✅ SAFETY CHECK
    if (!Array.isArray(departments)) {
      console.error("Expected array, got:", departments);
      return;
    }

    departmentGrid.innerHTML = "";


    departments
      .filter(dep => dep.is_active === "Yes")
      .slice(1) // skip first department
      .forEach(dep => {
        const card = document.createElement("div");
        card.className = `
          bg-white dark:bg-slate-800 rounded-xl p-5 shadow
          hover:shadow-md hover:-translate-y-1 transition cursor-pointer
        `;

        card.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold">${dep.department_code}</h3>
            <i class="bx bx-right-arrow-alt text-xl"></i>
          </div>
          <p class="text-sm">${dep.department_name}</p>
        `;
        card.dataset.departmentId = dep.id;


        // ✅ CLICK → OPEN DEPARTMENT DASHBOARD
        card.onclick = () => {
          console.log("Opening department:", dep);
          openDepartment(dep);
        }
          

        departmentGrid.appendChild(card);
      });

    // ✅ Add Department Card (always last)
    departmentGrid.innerHTML += `
      <div id="addBtn"
           class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow
           flex flex-col items-center justify-center gap-2
           hover:shadow-md hover:-translate-y-1 transition cursor-pointer">

        <button onclick="openDepartmentModal()"
                class="flex flex-col items-center justify-center w-full">
          <div class="w-10 h-10 flex items-center justify-center
                      rounded-full bg-blue-700">
            <i class="fa-solid fa-plus text-white"></i>
          </div>
          <span class="text-sm font-bold mt-2">Add Department</span>
        </button>

      </div>
    `;

  } catch (error) {
    console.error("Error loading departments:", error);
  }
}
let currentDepartment = null;

function openDepartment(dep) {
  currentDepartment = dep;

  // Set department title
  document.getElementById("departmentTitle").textContent =
    dep.department_code;

  // Switch page (your existing system)
  toggleVisibility("departmentDashboard");
  console.log("Opened department:", dep);

  // Load department-specific data
  loadDepartmentStats(dep.id);
  loadDepartmentUsers(dep.id);
}

async function loadDepartmentStats(departmentId) {
  try {
    const res = await fetch(`${API_BASE}/departments/${departmentId}/stats`);
    const stats = await res.json();

    document.getElementById("depttotalTasks").textContent = stats.total || 0;
    document.getElementById("deptpendingTasks").textContent = stats.pending || 0;
    document.getElementById("deptinProgressTasks").textContent = stats.inProgress || 0;
    document.getElementById("deptcompletedTasks").textContent = stats.completed || 0;
  } catch (err) {
    console.error("Failed to load stats", err);
  }
}
async function loadDepartmentUsers(departmentId) {
  try {
    const res = await fetch(`${API_BASE}/departments/${departmentId}/users`);
    const users = await res.json();

    const tbody = document.getElementById("departmentUsersTable");
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-gray-500">
            No users Yet.
          </td>
        </tr>
      `;
      return;
    }

    users.forEach(user => {
      console.log("user : ",user)
      tbody.innerHTML += `
        <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
          <td class="px-4 py-2">${user.name}</td>
          <td class="px-4 py-2">${user.role}</td>
          <td class="px-4 py-2">${user.email}</td>
          <td class="px-4 py-2">${user.contact}</td>
          <td class="px-4 py-2">${user.status}</td>
          <td class="px-4 py-2">
            <button class="edit-btn" onclick="openEditUserModal('${user.id}')">
                        <i class='bx bx-edit-alt cursor-pointer hover:text-blue-600'></i>
                        
                    </button>
                            
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Failed to load users", err);
  }
}

async function createDepartment() {
  const department_code =
    document.getElementById("departmentCode").value.trim();
  const department_name =
    document.getElementById("departmentName").value.trim();

  const res = await fetch(`${API_BASE}/departments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ department_code, department_name })
  });

  if (!res.ok) {
    alert("Failed to add department");
    return;
  }

  alert("Department added!");
  closeDepartmentModal();
  renderDepartments();
}


function openDepartmentModal() {
  document.getElementById("createDepartmentModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeDepartmentModal() {
  const form = document.getElementById("createDepartmentForm");
  form.reset();

  document.getElementById("createDepartmentModal").style.display = "none";
  document.body.style.overflow = "auto";
}




// Attach handlers
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized");
  // Default section
    loadDarkModePreference();
  initDarkModeToggle();
  toggleVisibility("mainpage");


  // Hide create button if not admin
  if (currentUser?.role !== "Admin") {
    document.querySelector(".create-btn")?.classList.add("hidden");
  }
  if (currentUser?.role !== "Admin" && currentUser?.role !== "Professor Incharge") {
    document.querySelector(".tasks-create-btn")?.classList.add("hidden");
  }


  if (currentUser?.role !== "Department Head") {
    document.querySelector(".events-propose-btn")?.classList.add("hidden");
  }


  // Sidebar title
  const sidebarTitle = document.getElementById("sidebarTitle");
  if (sidebarTitle) {
    sidebarTitle.innerHTML = `Welcome ${currentUser?.name || "Guest"}`;
    loadEvents();
  }

   document.getElementById("showdepartments")?.addEventListener("click", () => {
    console.log("Loading departments...");
    renderDepartments();
    toggleVisibility('allDepartments');
  });
  // Sidebar buttons
  document.getElementById("showtasks")?.addEventListener("click", () => {
    console.log("Loading tasks...");
    loadTasks();
    toggleVisibility('taskManagement');
  });

  document.getElementById("showusers")?.addEventListener("click", () => {
    console.log("Loading users...");
    loadUsers();
    // loadFacultyMembers();
    toggleVisibility('userManagement');
  });
  document.getElementById("showevents")?.addEventListener("click", () => {
    console.log("Loading events...");

    //  loadEvents();
    toggleVisibility('eventManagement');
  });
  document.getElementById("showreports")?.addEventListener("click", () => {
    console.log("Loading reports...");
    // loadReports();
    toggleVisibility('reportsPage');
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // User form
  const createUserForm = document.getElementById("createUserForm");
  if (createUserForm) {
    createUserForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (createUserForm.dataset.mode === "edit") {
        await updateUser(createUserForm.dataset.userId);
      } else {
        await createUser();
      }
    });
  }

  //department form
  
const createDepartmentForm = document.getElementById("createDepartmentForm");

if (createDepartmentForm) {
  createDepartmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    await createDepartment();
    
  });
}

// Event form
  const eventUserForm = document.getElementById("proposeEventForm");
  if (eventUserForm) {
    eventUserForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (eventUserForm.dataset.mode === "edit") {
        await updateEvent(eventUserForm.dataset.eventId);
      } else {
        await createEvent();
      }
    });
  }

  // Task form
  const createTaskForm = document.getElementById("createTaskForm");
  if (createTaskForm) createTaskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("form submitted");
    if (createTaskForm.dataset.mode === "edit") {
      await updateTask(createTaskForm.dataset.taskId);
    } else {
      await createTask(event);
    }
  });
});
