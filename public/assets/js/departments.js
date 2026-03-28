
// ================= USERS =================
let departmentUsers = [];

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
        const outer = document.createElement("div");
        outer.className = "flex flex-col justify-center items-center p-2 bg-[#6b728075] rounded-lg shadow hover:shadow-lg transition ";
        const card = document.createElement("div");
        card.className = `
          bg-white dark:bg-slate-800 rounded-xl p-5 shadow w-full
          hover:shadow-md hover:-translate-y-1 transition cursor-pointer
        `;

        card.innerHTML = `
          <div class="flex justify-between items-center mb-2 openArrow">
            <h3 class="font-semibold">${dep.department_code}</h3>
            <i class=" bx bx-right-arrow-alt text-2xl"></i>
          </div>
          <p class="text-sm">${dep.department_name}</p>
          
        `;
        card.dataset.departmentId = dep.id;


        // ✅ CLICK → OPEN DEPARTMENT DASHBOARD
        card.onclick = () => {
         
          openDepartment(dep);
        }

        const actions = document.createElement("div");
        actions.className = "dept-action-buttons w-full mt-1 flex justify-between items-center w-full px-4";
        actions.innerHTML=`
            <button class="dept-btn-edit p-1"  onclick="editDepartment(${dep.id}, '${dep.department_code}', '${dep.department_name}')">
              <i class="fas fa-edit text-xs"></i> 
            </button>
            <button class="dept-btn-delete p-1" onclick="deleteDepartment('${dep.id}')">
              <i class="fas fa-trash text-xs"></i> 
            </button>
          `


          outer.appendChild(card);
          if(currentUser?.role === "Admin")
          outer.appendChild(actions);
        departmentGrid.appendChild(outer);
      });
    if (currentUser?.role === "Admin") {
      // ✅ Add Department Card (always last)
      departmentGrid.innerHTML += `
      <div id="addBtn"
           class="bg-[#6b728075] dark:bg-slate-800 rounded-xl p-5 shadow
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

    departmentUsers = users;
      document.getElementById("totalDeptUsers").innerText = users.length ?? 0;
    renderDepartmentUsers(users);
  

  } catch (err) {
    console.error("Failed to load users", err);
  }
}

function renderDepartmentUsers(users) {
  const tbody = document.getElementById("departmentUsersTable");
  tbody.innerHTML = "";

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-gray-500">
          No users found
        </td>
      </tr>`;
    return;
  }

  users.forEach(user => {
    tbody.innerHTML += `
      <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
        <td class="px-4 py-2">${user.name}</td>
        <td class="px-4 py-2">${user.role}</td>
        <td class="px-4 py-2">${user.email}</td>
        <td class="px-4 py-2">${user.contact}</td>
        <td class="px-4 py-2">${user.status}</td>

        ${currentUser?.role === "Admin" ? `
        <td class="px-4 py-2">
          <button class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            onclick="openEditUserModal('${user.id}')">
            <i class='bx bx-edit-alt'></i>
          </button>

          <button class="del-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            onclick="deleteUser('${user.id}')">
            <i class='bx bx-trash'></i>
          </button>
        </td>` : ``}
      </tr>
    `;
  });
}
let editingDepartmentId = null;
async function createDepartment() {

  const department_code =
    document.getElementById("departmentCode").value.trim();

  const department_name =
    document.getElementById("departmentName").value.trim();

  const url = editingDepartmentId
    ? `${API_BASE}/departments/${editingDepartmentId}`
    : `${API_BASE}/departments`;

  const method = editingDepartmentId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify({ department_code, department_name })
  });

  if (!res.ok) {
    alert("Failed to save department");
    return;
  }

  alert(editingDepartmentId ? "Department updated!" : "Department added!");

  editingDepartmentId = null;

  closeDepartmentModal();
  renderDepartments();
}
function editDepartment(id, code, name) {

  editingDepartmentId = id;

  document.getElementById("departmentCode").value = code;
  document.getElementById("departmentName").value = name;


  openDepartmentModal();
}
async function deleteDepartment(id) {
  if (!confirm("Delete this department?")) return;

  const res = await fetch(`${API_BASE}/departments/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  });

  if (!res.ok) {
    alert("Failed to delete department");
    return;
  }

  renderDepartments();
}



function openDepartmentModal() {
  
  document.getElementById("createDepartmentModal").style.display = "block";
  document.getElementById("deptModalTitle").textContent =
  editingDepartmentId ? "Edit Department" : "Create Department";
  document.getElementById("deptSubmitBtn").textContent =
  editingDepartmentId ? "Update Department" : "Create Department";
  document.body.style.overflow = "hidden";
}

function closeDepartmentModal() {
  const form = document.getElementById("createDepartmentForm");
  form.reset();

    editingDepartmentId = null;

  document.getElementById("createDepartmentModal").style.display = "none";
  document.body.style.overflow = "auto";
}
async function uploadDocument(event) {
  const form = event.target;
  const currentTaskId = form.dataset.taskId;

  const loader = document.getElementById("loaderOverlay");
  loader.style.display = "flex"; // show overlay

  try {
    const file = document.getElementById("file").files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE}/tasks/${currentTaskId}/deliverables`,
      {
        method: "POST",
        headers: getHeaders(false),
        body: formData
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Upload failed:", text);
      alert("Upload failed. File may be too large.");
      return;
    }

    alert("File uploaded successfully!");


  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  } finally {
    loader.style.display = "none"; // hide loader
     
     closeUploadDocModal();
     updateTaskProgress(currentTaskId, 100);

  
  }
}
async function viewDoc(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/viewDoc`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error("No deliverables Uploaded Yet.");

    const data = await response.json();

    window.open(data.drive_file_url, "_blank");  
    // open in new tab
  } catch (err) {
    alert(err.message);
  }
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