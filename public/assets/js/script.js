
let donutChart, barChart;

/* -----------------------------
   DONUT CHART
------------------------------*/
async function loadDonutChart() {
  const res = await fetch(`${API_BASE}/reports/task-summary`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    console.error("Donut chart API failed", res.status);
    return;
  }

  const data = await res.json();

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(document.getElementById("donutChart"), {
    type: "doughnut",
    data: {
      labels: ["Pending", "Completed", "Overdue", "In-Progress", "Total Tasks"],
      datasets: [{
        data: [
          data.pending,
          data.completed,
          data.overdue,
          data.in_progress,
          data.total
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "60%",
      plugins: { legend: { display: true } }
    }
  });
}

/* -----------------------------
   BAR CHART
------------------------------*/
async function loadBarChart() {
  const res = await fetch(`${API_BASE}/reports/tasks-by-department`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    console.error("Bar chart API failed", res.status);
    return;
  }

  let rows = await res.json();
 
  rows = rows.filter(r=> r.department !== 'ADMIN')

  const labels = rows.map(r => r.department);
  const counts = rows.map(r => r.count);

  if (barChart) barChart.destroy();

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: counts,
        borderRadius: 8
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* -----------------------------------
   LOAD TASK SUMMARY COUNTERS
------------------------------------*/
async function loadTaskCounters() {
  const res = await fetch(`${API_BASE}/reports/task-summary`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    console.error("Failed to load task counters");
    return;
  }

  const data = await res.json();

  document.getElementById("totaltasks").innerText = data.total ?? 0;
  document.getElementById("pendingtasks").innerText = data.pending ?? 0;
  document.getElementById("inprogresstasks").innerText = data.in_progress ?? 0;
  document.getElementById("completedtasks").innerText = data.completed ?? 0;
}


/* PAGE LOAD ANIMATION */
window.addEventListener("load", () => {
  document.querySelectorAll("aside, main").forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "all 0.6s ease";

    setTimeout(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, i * 150);
  });
});


const rows = document.querySelectorAll("#taskTable tr");

/* PROGRESS BAR ANIMATION */
document.querySelectorAll(".progress-bar").forEach(bar => {
  const targetWidth = bar.classList.contains("w-full") ? "100%" : "25%";
  bar.style.width = "0%";

  setTimeout(() => {
    bar.style.transition = "width 0.8s ease";
    bar.style.width = targetWidth;
  }, 300);
});

/* ROW FOCUS EFFECT */
rows.forEach(row => {
  row.addEventListener("mouseenter", () => {
    rows.forEach(r => r !== row && (r.style.opacity = "0.4"));
  });
  row.addEventListener("mouseleave", () => {
    rows.forEach(r => (r.style.opacity = "1"));
  });
});

/* ICON CLICK FEEDBACK */
document.querySelectorAll("i").forEach(icon => {
  icon.addEventListener("click", () => {
    icon.style.transform = "scale(1.3)";
    setTimeout(() => (icon.style.transform = "scale(1)"), 150);
  });
});

async function loadNotifications() {

  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });

    if (!res.ok) return;

    const notifications = await res.json();
    notifications.forEach(n => {

  if (n.is_read === "No") {
      showToast(n.title, n.message);
  }

});


    const lists = document.querySelectorAll(".notificationList");
    const counts = document.querySelectorAll(".notificationCount");

    let unread = 0;

    notifications.forEach(n => {
      if (n.is_read === "No") unread++;
    });

    lists.forEach(list => {
      list.innerHTML = "";

      notifications.forEach(n => {

        list.innerHTML += `
          <div onclick="markNotificationRead(${n.id})"
            class="p-3 border-b dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">

            <p class="font-semibold text-sm">${n.title}</p>

            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${n.message}
            </p>

            <p class="text-xs text-gray-400 mt-1">
              ${formatDate(n.created_at)}
            </p>

          </div>
        `;
      });

    });

    counts.forEach(count => {

      if (unread > 0) {
        count.classList.remove("hidden");
        count.textContent = unread;
      } else {
        count.classList.add("hidden");
      }

    });

  } catch (err) {
    console.error("Failed to load notifications", err);
  }

}
document.querySelectorAll(".notificationBtn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    const dropdown = btn.parentElement.querySelector(".notificationDropdown");

    dropdown.classList.toggle("hidden");
  });
});
async function markNotificationRead(id) {

  await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getHeaders()
  });

  loadNotifications();

}
async function markAllRead() {

  await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: getHeaders()
  });

  loadNotifications();


}
function showToast(title, message) {

  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");

  toast.className = `
  bg-[#374151] dark:bg-slate-800
  border border-gray-200 dark:border-slate-700
  shadow-lg rounded-lg p-4 w-[500px]
  animate-slideIn
  `;

  toast.innerHTML = `
    <p class="font-semibold text-white text-sm">${title}</p>
    <p class="text-xs text-white dark:text-gray-400">${message}</p>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);

}
document.addEventListener("click", (e) => {

  document.querySelectorAll(".notificationDropdown").forEach(dropdown => {

    const parent = dropdown.closest(".relative");

    if (!parent.contains(e.target)) {
      dropdown.classList.add("hidden");
    }

  });

});