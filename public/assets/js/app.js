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

function getHeaders(isJson = true) {
  const headers = {};

  if (authToken) {
    headers["Authorization"] = "Bearer " + authToken;
  }

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
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
    if (el.id !== showId) {
      el.style.display = "none";
    }

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
    ${currentUser?.role === "Faculty/File Incharge" ? "<th>Upload Docs</th>" : "<th>View Docs</th>"}
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
          <span class="bg-green-200 border text-green-800 px-2 py-1 rounded-full">${progressSection} completed</span>
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
      ${currentUser?.role === "Faculty/File Incharge" ? `<td class='text-slate-700 p-3 flex items-center justify-center'><i onclick=openUploadDocModal('${task.id}') class='bx bx-upload p-3 text-red-500 text-2xl cursor-pointer  dark:text-slate-200 hover:text-green-500 transition'></i></td>` : "<td class='text-slate-700 p-3 flex items-center justify-center'><i class='bx bx-show p-3 text-red-500 text-2xl cursor-pointer  dark:text-slate-200 hover:text-green-500 transition'></i></td>"}
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
  document.getElementById("taskDeliverables").value = task.deliverables;
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
  const deliverables = document.getElementById("taskDeliverables").value;
  const status = document.getElementById("taskStatus")?.value || null;
  const assigned_to = document.getElementById("hiddenAssignedTo").value;
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ title, description, deadline, priority, deliverables, status, assigned_to })
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
    option.textContent = `${faculty.name} (${faculty.department_code})`;
    option.setAttribute('id', faculty.id); // set id for easy access later
    select.appendChild(option);
  });
}



async function createTask(event) {
  event.preventDefault();


  const faculty = await getUserById(document.getElementById("taskAssignedTo").value);

  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const deadline = document.getElementById("taskDueDate").value;
  const priority = document.getElementById("taskPriority").value;
  const deliverables = document.getElementById("taskDeliverables").value;
  const assigned_to = document.getElementById("taskAssignedTo").value;
  const assigned_by = currentUserid;
  const department = faculty.department_id;


  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, description, deadline, priority, deliverables, assigned_to, assigned_by, department_id: department })
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

  renderApprovalCards(events);
  renderEventsTable(events);
}
function renderApprovalCards(events) {
  const container = document.getElementById("eventApprovalCards");
  container.innerHTML = "";
  if (currentUser.role === "Department Head" || currentUser.role === "Professor Incharge") {
    container.innerHTML = `
  <!-- Propose New Event -->
  <div onclick="openEventModal()" class="bg-green-100 h-[15vh] dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Propose New Event</h2>
      <p class="text-sm text-green-600 dark:text-green-300">Create a new event proposal</p>
    </div>
    <i class='bx bx-user-plus text-4xl p-3'></i>
  </div>

  <!-- Pending Approval -->
  <div class="bg-yellow-100 h-[15vh] dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Pending Approval</h2>
      <p id="pendingEvents" class="text-2xl font-bold">4</p>
    </div>
    <i class='bx bx-hourglass text-4xl p-3'></i>
  </div>

  <!-- Events Approved -->
  <div class="bg-blue-100 h-[15vh] dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Approved</h2>
      <p id="approvedEvents" class="text-2xl font-bold">15</p>
    </div>
    <i class='bx bx-check-circle text-4xl p-3'></i>
  </div>

  <!-- Events Rejected -->
  <div class="bg-red-100 h-[15vh] dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Rejected</h2>
      <p id="rejectedEvents" class="text-2xl font-bold">3</p>
    </div>
    <i class='bx bx-x-circle text-4xl p-3'></i>
  </div>
`;
  }
  else {
    events
    .filter(ev => ev.status === "Pending")
    .slice(0, 6) // show latest 6
    .forEach(ev => {
      container.innerHTML += `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
          <h4 class="font-semibold text-sm mb-2">
            ${ev.title} proposed by ${ev.department_code || "-"}
          </h4>
          <p class="text-xs">Venue – ${ev.venue || "-"}</p>
          <p class="text-xs mb-3">Participants – ${ev.participants}</p>
          <div class="flex gap-2">
            <button onclick="approveEvent(${ev.id})"
              class="px-3 py-1 rounded-full text-xs bg-green-500 text-white">
              Approve
            </button>
            <button onclick="rejectEvent(${ev.id})"
              class="px-3 py-1 rounded-full text-xs bg-red-500 text-white">
              Reject
            </button>
          </div>
        </div>
      `;
    });
  }
  
}
function renderEventsTable(events) {
  const tbody = document.getElementById("eventTableBody");
  tbody.innerHTML = "";

  events.forEach(ev => {
    const badge =
      ev.status === "Approved"
        ? "bg-green-100 text-green-700"
        : ev.status === "Rejected"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

    tbody.innerHTML += `
      <tr class="border-b dark:border-slate-700">
        <td class="px-4 py-2">${ev.title}</td>
        <td class="px-4 py-2">${ev.department_code || "-"}</td>
        <td class="px-4 py-2">${formatDate(ev.event_date)}</td>
        <td class="px-4 py-2">${ev.venue || "-"}</td>
        <td class="px-4 py-2">
          <span class="px-3 py-1 text-xs rounded-full ${badge}">
            ${ev.status}
          </span>
        </td>
      </tr>
    `;
  });
}
let calendar;


async function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (calendar) return;
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "auto",
    headerToolbar: {
      left: "prev ,today",
      center: "title",
      right: "next"

    },
    events: fetchCalendarEvents,
    eventContent: renderEventSquare,
    eventClick: handleEventClick,
    dateClick: () => {
      document.getElementById("eventDetailsWrapper").classList.add("hidden");
    }

  });

  calendar.render();
}

async function fetchCalendarEvents(fetchInfo, successCallback, failureCallback) {
  console.log("🔥 fetchCalendarEvents CALLED");
  try {
    const res = await fetch(`${API_BASE}/events/approved`, {
      headers: getHeaders()
    });

    const events = await res.json();

    const calendarEvents = events.map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.event_date, // YYYY-MM-DD
      extendedProps: {
        department: ev.department_code,
        venue: ev.venue,
        participants: ev.participants
      }
    }));

    successCallback(calendarEvents);
  } catch (err) {
    console.error(err);
    failureCallback(err);
  }
}
function handleEventClick(info) {
  const ev = info.event;

  // Fill data
  document.getElementById("eventTitle").textContent = ev.title;
  document.getElementById("eventVenue").textContent =
    ev.extendedProps.venue || "-";
  document.getElementById("eventDepartment").textContent =
    ev.extendedProps.department || "-";
  document.getElementById("eventParticipants").textContent =
    ev.extendedProps.participants ?? "-";
  document.getElementById("eventDate").textContent =
    ev.start.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  // Show the card
  document.getElementById("eventDetailsWrapper").classList.remove("hidden");
  const wrapper = document.getElementById("eventDetailsWrapper");
  wrapper.classList.remove("hidden");

  setTimeout(() => {
    wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}


function renderEventSquare(arg) {
  const dept = arg.event.title || "-";

  const square = document.createElement("div");
  square.className =
    "dept-square flex items-center justify-center text-xs text-wrap text-center font-bold";

  square.textContent = dept;

  return { domNodes: [square] };
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
async function createEvent(form) {
  const title = form.eventTitle?.value;
  const event_date = form.eventDate?.value;
  const participants = Number(form.eventParticipants?.value || 0);
  const venue = form.eventVenue?.value || null;
  const department_id = currentUser?.department_id;

  console.log("Frontend values:", {
    title,
    event_date,
    participants,
    venue,
    department_id
  });

  if (!title || !event_date || !department_id) {
    alert("Missing required fields");
    return;
  }

  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      title,
      department_id,
      event_date,
      participants,
      venue
    })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message || "Failed to create event");
    return;
  }

  alert("Event Proposed!");
  closeEventModal();
  loadEvents();
}



async function approveEvent(id) {
  await fetch(`${API_BASE}/events/${id}/approve`, { method: "POST", headers: getHeaders() });
  alert("Event approved!");
  loadEvents();
}
async function rejectEvent(id) {
  await fetch(`${API_BASE}/events/${id}/reject`, { method: "POST", headers: getHeaders() });
  alert("Event rejected!");
  loadEvents();
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
  loadDepartmentUsers(currentDepartment.id);
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
    if (currentUser?.role === "Admin") {
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
    }


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
      console.log("user : ", user)
      tbody.innerHTML += `
        <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
          <td class="px-4 py-2">${user.name}</td>
          <td class="px-4 py-2">${user.role}</td>
          <td class="px-4 py-2">${user.email}</td>
          <td class="px-4 py-2">${user.contact}</td>
          <td class="px-4 py-2">${user.status}</td>
          ${currentUser?.role === "Admin" ? `
          <td class="px-4 py-2">
            <button class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" onclick="openEditUserModal('${user.id}')">
                        <i class='bx bx-edit-alt cursor-pointer hover:text-blue-600'></i>
                        
                    </button>
                    <button class="del-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onclick="deleteUser('${user.id}')">
                        <i class='bx bx-trash cursor-pointer hover:text-red-600'></i>
                    </button>
                            
          </td>
        </tr>`: ``}
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

async function uploadDocument(event) {
 const form = event.target; // 👈 this is the form
  const currentTaskId = form.dataset.taskId;
  console.log("Uploading document for task ID:", currentTaskId);
    const file = document.getElementById("file").files[0];
    const formData = new FormData();
    formData.append("file", file);
    

    const res = await fetch(
      `${API_BASE}/tasks/${currentTaskId}/deliverables`,
      {
        method: "POST",
        headers: getHeaders(false), // No JSON header for FormData
        body: formData
      }
    );
if (!res.ok) {
  const text = await res.text(); // 👈 NOT json()
  console.error("Upload failed:", text);
  alert("Upload failed. File may be too large.");
  return;
}
    const data = await res.json();
    alert(data.message);
    closeUploadDocModal();
    loadTasks();
}
function openUploadDocModal(taskId) {
  const modal = document.getElementById("uploadDocumentModal");
  const form = document.getElementById("uploadDocumentForm");

  modal.style.display = "block";
  form.dataset.taskId = taskId; // 👈 stored here  
  document.body.style.overflow = "hidden";
}

function closeUploadDocModal() {
  const form = document.getElementById("uploadDocumentForm");
  form.reset();

  document.getElementById("uploadDocumentModal").style.display = "none";
  document.body.style.overflow = "auto";
}


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
async function loadEventSummaryCards() {
  const res = await fetch(`${API_BASE}/events/event-summary`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    console.error("Failed to load event summary");
    return;
  }

  const data = await res.json();

  console.log("Event summary:", data);

  document.getElementById("pendingEvents").textContent = data.pending;
  document.getElementById("approvedEvents").textContent = data.approved;
  document.getElementById("rejectedEvents").textContent = data.rejected;
}

// Attach handlers
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized");
  

  // Default section

  loadDarkModePreference();
  initDarkModeToggle();
  toggleVisibility("mainpage");

  initCalendar();


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
    
  }
  const sidebartasks = document.getElementById("showtasks");
  if (sidebartasks && currentUser?.role === "Department Head") {
    sidebartasks.innerHTML = "View Tasks";
  }
  const sidebardepartments = document.getElementById("showdepartments");
  if (sidebardepartments && currentUser?.role === "Department Head") {
    sidebardepartments.innerHTML = "View Faculty";
  }
  const sidebarevents = document.getElementById("showevents");
  if (sidebarevents && currentUser?.role === "Department Head") {
    sidebarevents.innerHTML = "Propose Events";
  }
  const eventApprovalText = document.getElementById("eventApprovalText");
  if (eventApprovalText && currentUser?.role === "Department Head") {
    eventApprovalText.innerHTML = "";
  }
  document.getElementById("overview")?.addEventListener("click", () => {
    console.log("Loading overview...");
    renderDepartments();
    toggleVisibility('mainpage');
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    
    document.getElementById("overview").classList.add("active");
    
  });
  document.getElementById("showdepartments")?.addEventListener("click", () => {
    console.log("Loading departments...");
    renderDepartments();
    toggleVisibility('allDepartments');
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    
    document.getElementById("showdepartments").classList.add("active");
    
  });
  // Sidebar buttons
  document.getElementById("showtasks")?.addEventListener("click", () => {
    console.log("Loading tasks...");
    loadTasks();
    toggleVisibility('taskManagement');
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    document.getElementById("showtasks").classList.add("active");
  });

  
  document.getElementById("showevents")?.addEventListener("click", () => {
    console.log("Loading events...");
     
    loadEvents();
    loadEventSummaryCards();
    toggleVisibility('eventManagement');
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    document.getElementById("showevents").classList.add("active");
  });
  document.getElementById("showreports")?.addEventListener("click", async () => {
    console.log("Loading reports...");

    await populateDepartmentFilter();
    await populateFacultyFilter();
    applyFilters();
    toggleVisibility('reportsPage');
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    document.getElementById("showreports").classList.add("active"); 
    const darkModeToggle = document.getElementById('darkToggle');

    darkModeToggle.addEventListener('click', () => {
      console.log("Dark mode toggled from reports page");
      document.documentElement.classList.toggle('dark');
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
    });

  });

  const buttons = document.getElementsByClassName("logoutBtn");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/index.html";
    });
  }
  // Login form
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    
    loginForm.addEventListener("submit", handleLogin);
  }

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
        await createEvent(event.target);
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

  const uploadDocumentForm = document.getElementById("uploadDocumentForm");
  if (uploadDocumentForm) {
    uploadDocumentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Uploading document...");
      await uploadDocument(event);
    });
  }
});
