const searchInput = document.getElementById("searchInput");
const filterBtn = document.getElementById("filterBtn");
const filterMenu = document.getElementById("filterMenu");
const results = document.getElementById("results");

// Sample dataset
const data = [
  { id: 1, name: "Paris", category: "Option1" },
  { id: 2, name: "London", category: "Option2" },
  { id: 3, name: "New York", category: "Option1" },
  { id: 4, name: "Tokyo", category: "Option2" }
];

// Toggle filter menu
filterBtn.addEventListener("click", () => {
  filterMenu.classList.toggle("hidden");
});

// Render results
function renderResults(filteredData) {
  results.innerHTML = "";
  filteredData.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.name;
    results.appendChild(li);
  });
}

// Filter logic
function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const selectedFilters = Array.from(
    filterMenu.querySelectorAll("input:checked")
  ).map(input => input.value);

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(query) &&
    (selectedFilters.length === 0 || selectedFilters.includes(item.category))
  );

  renderResults(filteredData);
}

// Event listeners
searchInput.addEventListener("input", applyFilters);
filterMenu.addEventListener("change", applyFilters);

// Initial render
renderResults(data);