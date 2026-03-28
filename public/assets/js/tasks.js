
// ---- Tasks ----

let allTasks = [];
async function loadTasks() {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: getHeaders(),
    cache: "no-store"
  });

  if (!res.ok) return alert("Failed to load tasks");

  const tasks = await res.json();
  allTasks = tasks;

  // Filter tasks based on role
  let filteredTasks = tasks;

  if (currentUser?.role === "Department Head") {
    // Department Head sees tasks in their department
    filteredTasks = tasks.filter(task => task.department_id === currentUser.department_id);
  }

  // Admin sees all tasks, no filtering needed

  renderTasks(filteredTasks);


}

function renderTasks(tasks) {
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
    ${!(currentUser?.role === "Admin") ? "" : "<th>Department</th>"}
    <th>Priority</th>
    <th>Due Date</th>
    <th>Status</th>
    ${(currentUser?.role === "Department Head") ? "" : "<th>Actions</th>"}
  </tr>
`;
  const tableBody = document.getElementById("taskrows");
  tableBody.innerHTML = ""; // Reset table before rendering

  for (const task of tasks) {
    const row = document.createElement("tr");

    // ✅ Status dropdown for Professor Incharge only
    let statusDropdown = "";
    if (currentUser?.role === "Admin") {
      statusDropdown = `
        <select 
          onchange="updateTaskStatus(${task.id}, this.value)"
          style="padding:3px;border-radius:5px;cursor:pointer;">
          <option value = "">Select status</option>
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
          <div class="tasks-action-buttons flex gap-2 justify-center items-center">
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
      actions = "";
    }

    // ✅ Build the row using new schema fields
    row.innerHTML = `
      <td class="text-slate-700 p-3 dark:text-slate-200">${task.title}</td>
      <td class='text-slate-700 p-3 '>
     ${task.has_deliverables != 0 ? `<i  onclick=viewDoc('${task.id}') class='bx bx-show p-3 text-blue-700 text-2xl cursor-pointer  dark:text-slate-200 hover:text-green-500 transition' ></i>
`: `<i class='bx bx-hide text-red-400 text-2xl'></i>`}
      
      </td>
      ${currentUser?.role === "Faculty/File Incharge" ? "" : `<td class="text-slate-700 p-3 dark:text-slate-200">${task.assignee_name || "Unassigned"}</td>`}
     ${!(currentUser?.role === "Admin") ? "" : `<td class="text-slate-700 font-bold word-wrap w-60 dark:text-slate-200">${task.department_name}</td>`}
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
  document.getElementById("taskDueDate").value =
    task.deadline;
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
  loadTasksCards();
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
  loadTasksCards();
}


async function updateTaskProgress(taskId, progress) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/progress`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ progress: Number(progress) })
  });
  if (!res.ok) return alert("Failed to update progress");

  if (progress == 100) {
    updateTaskStatus(taskId, "Submitted");
  } else {
    updateTaskStatus(taskId, "In Progress");
  }
  await loadTasksCards();
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    if (!newStatus) return; // No status selected
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
    loadTasks();
    loadTasksCards(); // Refresh the tasks 
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

  if (currentUser.role === "Professor Incharge") {
    // If Professor Incharge, only show faculty from their department
    facultyMembers = facultyMembers.filter(faculty => (faculty.department_id === currentUser.department_id) && (faculty.status === "Active"));
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
  loadTasksCards();
}

document.getElementById("taskFilterStatus").addEventListener("change", function () {

  const status = this.value;

  if (!status) {
    renderTasks(allTasks);
    return;
  }

  const filtered = allTasks.filter(task => task.status === status);

  renderTasks(filtered);

});
document.getElementById("taskFilterPriority").addEventListener("change", function () {

  const priority = this.value;

  if (!priority) {
    renderTasks(allTasks);
    return;
  }

  const filtered = allTasks.filter(task => task.priority === priority);

  renderTasks(filtered);

});
document.getElementById("taskFilterDept").addEventListener("change", function () {

  const department = Number(this.value);

  if (!department) {
    renderTasks(allTasks);
    return;
  }

  const filtered = allTasks.filter(task => task.department_id === department);

  renderTasks(filtered);

});


async function populateTaskDepartmentFilter() {

  const select = document.getElementById("taskFilterDept");
  if (!select) return;

  try {

    const res = await fetch(`${API_BASE}/departments`, {
      headers: getHeaders()
    });

    if (!res.ok) throw new Error("Failed to load departments");

    const departments = await res.json();

    select.innerHTML = `<option value="">All Departments</option>`;

    departments
      .filter(dep => dep.is_active === "Yes")
      .forEach(dep => {

        if (dep.id === 1) return; // Skip "General" department
        const option = document.createElement("option");

        option.value = dep.id;                     // used for filtering
        option.textContent = dep.department_code; // display

        select.appendChild(option);

      });

  } catch (err) {
    console.error("Error loading department filter:", err);
  }
}