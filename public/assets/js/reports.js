document.addEventListener("DOMContentLoaded", function () {
  const deadlines = [
    { title: "Prepare Department Report", start: "2025-08-25", color: "#3B82F6" },
    { title: "Faculty Meeting", start: "2025-08-28", color: "#10B981" },
    { title: "Submit Event Proposal", start: "2025-09-02", color: "#F59E0B" },
    { title: "Annual Seminar", start: "2025-09-08", color: "#EF4444" }
  ];

  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "650px",
    expandRows: true,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    events: deadlines,
    eventClick: function (info) {
      alert(`📌 ${info.event.title}\n📅 ${info.event.start.toLocaleDateString()}`);
    }
  });

  calendar.render();

  // Update dummy analytics counters
  document.getElementById("totalEvents").textContent = deadlines.length;
  document.getElementById("pendingTasks").textContent = 2;
  document.getElementById("completedReports").textContent = 1;
  document.getElementById("upcomingDeadlines").textContent = 3;

  // Download PDF Report
  document.getElementById("downloadPdf").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Task Report", 10, 10);

    let y = 20;
    deadlines.forEach((task, i) => {
      doc.text(`${i + 1}. ${task.title} | Date: ${task.start}`, 10, y);
      y += 8;
    });

    doc.save("task_report.pdf");
  });

  // Download Excel Report
  document.getElementById("downloadExcel").addEventListener("click", function () {
    const worksheet = XLSX.utils.json_to_sheet(deadlines);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "task_report.xlsx");
  });
});
