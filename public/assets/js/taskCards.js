
let allCardsTasks = [];
// Priority pill styles
const priorityPill = {
  Low: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  Medium: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  High: "bg-red-100   dark:bg-red-900/40   text-red-700   dark:text-red-400",
};

// Status styles
const statusCfg = {
  Pending: { dot: "bg-amber-400 dark:bg-amber-300", pill: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  "In Progress": { dot: "bg-blue-400 dark:bg-blue-300", pill: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  Submitted: { dot: "bg-purple-400 dark:bg-purple-300", pill: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  Verified: { dot: "bg-green-400 dark:bg-green-300", pill: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  Closed: { dot: "bg-gray-400 dark:bg-gray-300", pill: "bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400" },
};

// Fetch + filter tasks (reused from loadTasks)
async function fetchFilteredTasks() {

  const res = await fetch(`${API_BASE}/tasks`, {
    headers: getHeaders(),
    cache: "no-store"
  });

  if (!res.ok) throw new Error("Failed to load tasks");

  const tasks = await res.json();

  let filtered = tasks;

  if (currentUser?.role === "Faculty" || currentUser?.role === "Faculty/File Incharge") {
    filtered = tasks.filter(t => t.assigned_to === currentUser.id);
  }
  else if (currentUser?.role === "Professor Incharge") {
    filtered = tasks.filter(t => t.department_id === currentUser.department_id);
  }

  allCardsTasks = filtered;   // ✅ store correctly
  return filtered;

}

// Build a single card
function buildCard(task, index) {
  const pc = priorityPill[task.priority] || priorityPill.Low;
  const sc = statusCfg[task.status] || statusCfg.Pending;


  let progressSection = "";

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


  let statusDropdown = ` <select class='w-[100%] border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' 
          onchange="updateTaskStatus(${task.id}, this.value)"
          style="padding:3px;border-radius:5px;cursor:pointer;">

             <option value="" selected disabled hidden>-- Update Task Status --</option>

          <option value="Verified" ${task.status === "Verified" ? "selected" : ""}>Verified</option>
          <option value="Closed" ${task.status === "Closed" ? "selected" : ""}>Closed</option>
          
        </select>`;
  let action = "";

  if (currentUser?.role === "Faculty/File Incharge") {
    action = progressSection;

  } else {
    action = statusDropdown;
  }

  const btns = ` <div class="tasks-action-buttons w-[100%] py-5 flex justify-between items-center">
            <button class="tasks-btn-edit" onclick="editTask('${task.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="tasks-btn-delete" onclick="deleteTask('${task.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>`;
  const uploadButton = task.has_deliverables
    ?
    `<div class="flex justify-between gap-3 items-center">
<button onclick="deleteDeliverable(${task.id}, ${task.deliverable_id})"
       class="flex items-center gap-1.5 text-xs px-4 font-semibold text-red-600 dark:text-red-400 border border-dashed border-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
       Delete Docs
     </button>
   <button  onclick=viewDoc('${task.id}')
       class="flex items-center gap-1.5 text-xs px-4 font-semibold text-blue-500 dark:text-blue-400 border border-dashed border-blue-500 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
       View Docs
     </button>
     </div>`: (currentUser?.role === "Faculty/File Incharge") ? ` <button  onclick=openUploadDocModal('${task.id}')
       class="flex items-center gap-1.5 w-full font-semibold  text-l px-4 font-semibold text-blue-500 dark:text-blue-400 border border-dashed border-blue-500 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
       Upload Document <svg class="px-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.4776 9.01106C17.485 9.01102 17.4925 9.01101 17.5 9.01101C19.9853 9.01101 22 11.0294 22 13.5193C22 15.8398 20.25 17.7508 18 18M17.4776 9.01106C17.4924 8.84606 17.5 8.67896 17.5 8.51009C17.5 5.46695 15.0376 3 12 3C9.12324 3 6.76233 5.21267 6.52042 8.03192M17.4776 9.01106C17.3753 10.1476 16.9286 11.1846 16.2428 12.0165M6.52042 8.03192C3.98398 8.27373 2 10.4139 2 13.0183C2 15.4417 3.71776 17.4632 6 17.9273M6.52042 8.03192C6.67826 8.01687 6.83823 8.00917 7 8.00917C8.12582 8.00917 9.16474 8.38194 10.0005 9.01101" />
    <path d="M12 13L12 21M12 13C11.2998 13 9.99153 14.9943 9.5 15.5M12 13C12.7002 13 14.0085 14.9943 14.5 15.5" />
</svg>



     </button>` : "<p class='text-slate-500 dark:text-slate-400 text-sm'>No Documents Uploaded Yet</p>";

  const assignedTo = (currentUser?.role === "Professor Incharge") ? `Assigned For:  ${task.assignee_name || "Unassigned"}` : "";

  return `
    <div class="card-anim bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
         style="animation-delay:${index * 80}ms">

      <!-- Title + Priority -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <h2 class="text-slate-800 dark:text-white text-base font-semibold leading-snug flex-1">${task.title}</h2>
        
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${pc}">${task.priority}</span>
      </div>
<h3 class="text-zinc-900 font-semibold py-3  dark:text-slate-400 text-l">${assignedTo}</h3>
      <!-- Meta -->
      <div class="flex items-center justify-between gap-6 mb-4">
        <div>
          <p class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">Due Date</p>
          <p class="text-slate-700 dark:text-slate-200 text-sm font-medium">📅 ${formatDate(task.deadline)}</p>
        </div>
        <div>
          <p class="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">Status</p>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full animate-pulse ${sc.dot}"></span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full status-pill ${sc.pill}">${task.status}</span>
          </div>
        </div>
      </div>

      <!-- Progress/Status -->
    
      <div class="mb-5">
       
        ${action}

      </div>

      <!-- Actions -->

      ${uploadButton}
        ${(currentUser?.role === "Professor Incharge") ? btns : ""}
      
    </div>
  `;
}

const grid = document.getElementById('cardGrid');

// Render all cards
function renderCards(tasks) {

  if (tasks.length === 0) {
    grid.innerHTML = "<p class='text-center text-gray-500 col-span-full'>No tasks found</p>";
    return;
  }

  grid.innerHTML = tasks.map((t, i) => buildCard(t, i)).join('');
}

// Public entry point
async function loadTasksCards() {
  try {
    const filteredTasks = await fetchFilteredTasks();
    renderCards(filteredTasks);
  } catch (err) {
    console.error(err);
    alert("Failed to load tasks");
  }
}

// ---- Helpers ----
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
}


async function deleteDeliverable(taskId, deliverableId) {
  if (!confirm("Are you sure you want to delete this document?")) return;


  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/deliverable/${deliverableId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete");

    alert("Document deleted successfully");
    loadTasksCards(); // refresh UI
  } catch (err) {
    console.error(err);
    alert("Error deleting document");
  }
}


document.getElementById("taskCardSearch").addEventListener("input", filterCards);
document.getElementById("taskCardFilterStatus").addEventListener("change", filterCards);
document.getElementById("taskCardFilterPriority").addEventListener("change", filterCards);

function filterCards() {

  const keyword = document.getElementById("taskCardSearch").value.toLowerCase();
  const status = document.getElementById("taskCardFilterStatus").value;
  const priority = document.getElementById("taskCardFilterPriority").value;

  let filtered = allCardsTasks;

  if (keyword) {
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(keyword) ||
      (task.assignee_name || "").toLowerCase().includes(keyword)
    );
  }

  if (status) {
    filtered = filtered.filter(task => task.status === status);
  }

  if (priority) {
    filtered = filtered.filter(task => task.priority === priority);
  }


  renderCards(filtered);
}