
// ---- Events ----
let allEvents = [];
async function loadEvents() {
  const res = await fetch(`${API_BASE}/events`, { headers: getHeaders() });
  if (!res.ok) return alert("Failed to load events");

  const events = await res.json();
  allEvents = events;

  if(currentUser.role === "Faculty/File Incharge" || currentUser.role === "Admin"){
    document.getElementById("propose-card").style.display = "none";
  }

  renderApprovalCards(events);
  renderEventsTable(events);
  loadEventSummaryCards();
}
function renderApprovalCards(events) {
  const container = document.getElementById("eventApprovalCards");
  container.innerHTML = "";
  if (currentUser.role === "Department Head" || currentUser.role === "Professor Incharge") {
    container.innerHTML = `


  <!-- Pending Approval -->
  <div class="bg-yellow-100 h-[15vh] dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Pending Approval</h2>
      <p id="pendingEvents" class="text-2xl font-bold"></p>
    </div>
    <i class='bx bx-hourglass text-4xl p-3'></i>
  </div>

  <!-- Events Approved -->
  <div class="bg-blue-100 h-[15vh] dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Approved</h2>
      <p id="approvedEvents" class="text-2xl font-bold"></p>
    </div>
    <i class='bx bx-check-circle text-4xl p-3'></i>
  </div>

  <!-- Events Rejected -->
  <div class="bg-red-100 h-[15vh] dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Rejected</h2>
      <p id="rejectedEvents" class="text-2xl font-bold"></p>
    </div>
    <i class='bx bx-x-circle text-4xl p-3'></i>
  </div>
  <!-- Events Completed -->
  <div class="bg-green-400 h-[15vh] dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Completed</h2>
      <p id="completedEvents" class="text-2xl font-bold"></p>
    </div>
    <i class='bx bx-check-circle text-4xl p-3'></i>
  </div>
  <!-- Events Cancelled -->
  <div class="bg-amber-300 h-[15vh] dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-5 flex items-center justify-between shadow hover:shadow-lg transition">
    <div>
      <h2 class="text-lg font-semibold">Events Cancelled</h2>
      <p id="cancelledEvents" class="text-2xl font-bold"></p>
    </div>
    <i class='bx bx-x-circle text-4xl p-3'></i>
  </div>
`;
  } else if (currentUser.role === "Faculty/File Incharge") {
    container.innerHTML = ``
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
              class="px-4 py-2 rounded-full text-xs bg-green-500 text-white active:bg-amber-700 active:scale-95">
              Approve
            </button>
            <button onclick="rejectEvent(${ev.id})"
              class="px-4 py-2 rounded-full text-xs bg-red-500 text-white active:bg-amber-700 active:scale-95">
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
     // Decide badge style
    let badgeClass =
      ev.status === "Approved" ? "bg-green-100 text-green-700" :
      ev.status === "Rejected" ? "bg-red-100 text-red-700" :
      ev.status === "Completed" ? "bg-blue-100 text-blue-700" :
      ev.status === "Cancelled" ? "bg-gray-100 text-gray-700" :
      "bg-yellow-100 text-yellow-700";

    // Decide actions
    let actions = "";
    if (currentUser?.role === "Department Head" && ev.status === "Approved") {
      actions = `
        <div class="flex gap-2 justify-center items-center">
          <button onclick="updateEvent(${ev.id},'Completed')" class="px-2 py-1 bg-blue-500 text-white rounded">
            <i class="fas fa-check"></i> Completed
          </button>
          <button onclick="updateEvent(${ev.id},'Cancelled')" class="px-2 py-1 bg-gray-500 text-white rounded">
            <i class="fas fa-times"></i> Cancelled
          </button>
        </div>
      `;
    }


    tbody.innerHTML += `
      <tr class="border-b dark:border-slate-700">
        <td class="px-4 py-2">${ev.title}</td>
        <td class="px-4 py-2">${ev.department_code || "-"}</td>
        <td class="px-4 py-2">${formatDate(ev.event_date)}</td>
        <td class="px-4 py-2">${ev.venue || "-"}</td>
        <td class="px-4 py-2">
          <span class="px-3 py-1 text-xs rounded-full ${badgeClass}">
            ${ev.status}
          </span>
        </td>
        <td class="px-4 py-2">
          ${actions}
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
  const clickedDate = info.event.startStr;

  // get all events loaded in the calendar
  const events = calendar.getEvents();

  // filter events for the same date
  const sameDayEvents = events.filter(ev => ev.startStr === clickedDate);

  const wrapper = document.getElementById("eventDetailsWrapper");
  wrapper.classList.remove("hidden");

  const container = document.getElementById("eventDetailsContainer");
  container.innerHTML = "";

  sameDayEvents.forEach(ev => {
    container.innerHTML += `
      <div class="flex flex-col w-[100vw]  bg-green-100 border border-gray-200 shadow-2xs
           rounded-xl p-4 md:p-5 max-w-md dark:bg-slate-700 dark:border-slate-600">

                                    <h3 id="eventTitle" class="text-xl font-bold text-gray-800 dark:text-slate-200">
                                        ${ev.title}
                                    </h3>

                                    <p id="eventVenue"
                                        class="mt-1 text-l font-medium uppercase text-red-800 dark:text-gray-400">
                                        ${ev.extendedProps.venue || "-"}
                                    </p>

                                    <!-- Structured details -->
                                    <div class="mt-4 space-y-2 text-sm text-gray-700 dark:text-slate-300">
                                        <p><span class="font-bold text-xl">Department: </span> <span
                                                id="eventDepartment" class="text-xl font-awesome">${ev.extendedProps.department || "-"}</span>
                                        </p>
                                        <p><span class="font-bold text-xl">Date: </span> <span id="eventDate"
                                                class="text-xl font-awesome">${new Date(ev.start).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })}</span></p>
                                        <p><span class="font-semibold text-xl">Participants: </span> <span
                                                id="eventParticipants" class="text-xl font-awesome">${ev.extendedProps.participants || "-"}</span>
                                        </p>
                                    </div>

                                </div>
    `;
  });

  setTimeout(() => {
    wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function renderEventSquare(arg) {
  const dept = arg.event.title || "-";

  const square = document.createElement("div");
  square.className =
    "dept-square cursor-pointer flex items-center justify-center text-xs text-wrap text-center font-bold";

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

async function updateEvent(id,status) {
  await fetch(`${API_BASE}/events/${id}/${status}`, { method: "PUT", headers: getHeaders() });
  alert("Event Status Updated!");
  loadEvents();
  
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




  const approvedEl = document.getElementById("approvedEvents");
  if (approvedEl) {
    approvedEl.textContent = data.approved;
  }
  const pendingEl = document.getElementById("pendingEvents");
  if (pendingEl) {
    pendingEl.textContent = data.pending;
  }
  const rejectedEl = document.getElementById("rejectedEvents");
  if (rejectedEl) {
    rejectedEl.textContent = data.rejected;
  }
  const completedEl = document.getElementById("completedEvents");
  if (completedEl) {
    completedEl.textContent = data.completed;
  }
  const cancelledEl = document.getElementById("cancelledEvents");
  if (cancelledEl) {
    cancelledEl.textContent = data.cancelled;
  }
}

document.getElementById("eventSearch").addEventListener("input", filterEvents);

document.getElementById("eventFilterStatus").addEventListener("change", filterEvents);

document.getElementById("eventFilterDept")?.addEventListener("change", filterEvents);

function filterEvents() {

  const search = document.getElementById("eventSearch").value.toLowerCase();
  const status = document.getElementById("eventFilterStatus").value;
  const dept = document.getElementById("eventFilterDept").value;

  let filtered = allEvents;

  if (search) {
    filtered = filtered.filter(ev =>
      ev.title.toLowerCase().includes(search) ||
      (ev.department_code || "").toLowerCase().includes(search) ||
      (ev.venue || "").toLowerCase().includes(search)
    );
  }

  if (status) {
    filtered = filtered.filter(ev => ev.status === status);
  }

  if (dept) {
    filtered = filtered.filter(ev =>
      Number(ev.department_id) === Number(dept)
    );
  }
  
  renderEventsTable(filtered);
  renderApprovalCards(filtered);
}

async function populateEventDepartmentFilter() {

  const select = document.getElementById("eventFilterDept");
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