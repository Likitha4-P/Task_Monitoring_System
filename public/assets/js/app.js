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

  const savedTheme = localStorage.getItem("darkMode");

  if (savedTheme === "true") {
    document.documentElement.classList.add("dark");
  }

  updateDarkModeIcon(); // set icon on page load

  document.querySelectorAll(".darkToggle").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      document.documentElement.classList.toggle("dark");

      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("darkMode", isDark);

      updateDarkModeIcon(); // update ALL icons
    });
  });
}

function updateDarkModeIcon() {
  const isDark = document.documentElement.classList.contains("dark");

  document.querySelectorAll(".darkModeIcon").forEach(icon => {
    icon.classList.remove("bx-moon", "bx-sun");

    if (isDark) {
      icon.classList.add("bx-sun");
    } else {
      icon.classList.add("bx-moon");
    }
  });
}
// Load dark mode preference on page load
function loadDarkModePreference() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}
function formatDateForInput(date) {
  return new Date(date).toISOString().split("T")[0];
}


function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}



// Attach handlers
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized");
  

  // Default section

  loadDarkModePreference();
  initDarkModeToggle();
  toggleVisibility("mainpage");

  initCalendar();
  loadNotifications();
  
  loadTaskCounters();
  loadDonutChart();
  loadBarChart();

  setInterval(() => {
    loadTaskCounters();
    loadDonutChart();
    loadBarChart();
  }, 120000); // refresh every 120 seconds
setInterval(loadNotifications, 30000);

  // Hide create button if not admin
  if (currentUser?.role !== "Admin") {
    document.querySelector(".create-btn")?.classList.add("hidden");
  }
  if (currentUser?.role !== "Admin" && currentUser?.role !== "Professor Incharge") {
    document.querySelectorAll(".tasks-create-btn").forEach(btn => {
  btn.classList.add("hidden");
});
  }


  if (currentUser?.role !== "Department Head") {
    document.querySelector(".events-propose-btn")?.classList.add("hidden");
  }

  if(currentUser?.role === "Faculty/File Incharge") {
    document.getElementById("showdepartments")?.classList.add("hidden");
    document.getElementById("showevents")?.classList.add("hidden");
  }
  // Sidebar title
  const sidebarTitle = document.getElementById("sidebarTitle");
  if (sidebarTitle) {
    sidebarTitle.innerHTML = `Welcome ${currentUser?.name || "Guest"}`;
    
  }
  const sidebartasks = document.getElementById("showtasks");
  if (sidebartasks && currentUser?.role === "Department Head") {
    sidebartasks.innerHTML = "View Tasks";
  } else if (sidebartasks && currentUser?.role === "Professor Incharge") {
    sidebartasks.innerHTML = "Assign/Approve Tasks";
  } else if (sidebartasks && currentUser?.role === "Faculty/File Incharge") {
    sidebartasks.innerHTML = "My Tasks";
  }

  const sidebardepartments = document.getElementById("showdepartments");
  if (sidebardepartments && (currentUser?.role === "Department Head" || currentUser?.role === "Professor Incharge")) {
    
    sidebardepartments.innerHTML = "My Department";
  }


  


  const sidebarevents = document.getElementById("showevents");
  if (sidebarevents && (currentUser?.role === "Department Head" || currentUser?.role === "Professor Incharge")) {
    sidebarevents.innerHTML = "Propose Events";
  }
  const eventApprovalText = document.getElementById("eventApprovalText");
  if (eventApprovalText && !(currentUser?.role === "Admin")) {
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
 
  document.getElementById("showdepartments")?.addEventListener("click", async () => {
  console.log("Loading departments...");

  await renderDepartments(); // wait until departments are ready
  toggleVisibility('allDepartments');

  if (currentUser?.role === "Professor Incharge" || currentUser?.role === "Department Head") {
    const dep = window._departments?.find(d => d.id === currentUser.department_id);
    if (dep) openDepartment(dep);
  }



  document.querySelectorAll(".sideBtn").forEach(el => el.classList.remove("active"));
  document.getElementById("showdepartments").classList.add("active");
});


    document.getElementById("userSearch").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();

  const filtered = departmentUsers.filter(user =>
    user.name.toLowerCase().includes(keyword) ||
    user.email.toLowerCase().includes(keyword) ||
    user.role.toLowerCase().includes(keyword) ||
    user.contact.includes(keyword)
  );

  renderDepartmentUsers(filtered);
});
  document.getElementById("taskSearch").addEventListener("input", function () {

  const keyword = this.value.toLowerCase();

  const filtered = allTasks.filter(task =>
    task.title.toLowerCase().includes(keyword) ||
    task.priority.toLowerCase().includes(keyword) ||
    task.status.toLowerCase().includes(keyword) ||
    (task.assignee_name || "").toLowerCase().includes(keyword)
  );

  renderTasks(filtered);

});

  // Sidebar buttons
  document.getElementById("showtasks")?.addEventListener("click", () => {
    console.log("Loading tasks...");
    if(currentUser?.role === "Faculty/File Incharge" || currentUser?.role === "Professor Incharge") {
      toggleVisibility('myTasks');
      const taskDeptFilter = document.getElementById("taskDeptFilter");
      if (taskDeptFilter) {
        taskDeptFilter.style.display = "none";
      }
      loadTasksCards();
    } else {
      toggleVisibility('taskManagement');
      populateTaskDepartmentFilter();
      loadTasks();

    }
    document.querySelectorAll(".sideBtn").forEach(el => {
    el.classList.remove("active");
  });
    document.getElementById("showtasks").classList.add("active");
  });

  
  document.getElementById("showevents")?.addEventListener("click", () => {
    console.log("Loading events...");
     
    loadEvents();
    populateEventDepartmentFilter();

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

    darkModeToggle?.addEventListener('click', () => {
      console.log("Dark mode toggled from reports page");
      document.documentElement.classList.toggle('dark');
      

      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      const icon = document.querySelector(".darkModeIcon");
      console.log(icon);

        if (icon.classList.contains("bx-moon")) {
    icon.classList.remove("bx-moon");
    icon.classList.add("bx-sun");
  } else {
    icon.classList.remove("bx-sun");
    icon.classList.add("bx-moon");
  }
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
