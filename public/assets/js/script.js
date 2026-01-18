
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

