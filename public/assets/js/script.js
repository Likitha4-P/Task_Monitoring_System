
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

  const rows = await res.json();

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

/* -----------------------------
   AUTO REFRESH
------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  

  loadTaskCounters();
  loadDonutChart();
  loadBarChart();

  setInterval(() => {
    loadTaskCounters();
    loadDonutChart();
    loadBarChart();
  }, 120000); // refresh every 120 seconds
});

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

/* SEARCH FILTER */
const search = document.getElementById("search");
const rows = document.querySelectorAll("#taskTable tr");

search.addEventListener("input", () => {
  const value = search.value.toLowerCase();
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

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
