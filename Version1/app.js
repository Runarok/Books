/* =========================================
   Runarok Books
   ========================================= */

const booksGrid = document.getElementById("booksGrid");
const filtersContainer = document.getElementById("filters");
const searchInput = document.getElementById("searchInput");

const bookCount = document.getElementById("bookCount");
const resultCount = document.getElementById("resultCount");
const sectionTitle = document.getElementById("sectionTitle");
const emptyState = document.getElementById("emptyState");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const footerYear = document.getElementById("footerYear");

let books = [];

async function loadBooks() {
  try {
    const response = await fetch("./books.json");

    if (!response.ok) {
      throw new Error("Could not load books.json");
    }

    books = await response.json();

    renderFilters();
    renderBooks();

  } catch (error) {
    console.error(error);
  }
}

loadBooks();


let activeCategory = "all";
let searchQuery = "";

/* =========================================
   Theme
   ========================================= */

function getPreferredTheme() {
  const saved = localStorage.getItem("books-theme");

  if (saved) {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  localStorage.setItem("books-theme", theme);

  themeIcon.textContent = theme === "dark" ? "☀" : "☾";
}

setTheme(getPreferredTheme());

themeToggle.addEventListener("click", () => {
  const current =
    document.documentElement.getAttribute("data-theme");

  setTheme(current === "dark" ? "light" : "dark");
});

/* =========================================
   Categories
   ========================================= */

function getCategories() {
  const categories = [...new Set(
    books.map(book => book.category)
  )];

  return categories;
}

function formatCategory(category) {
  const names = {
    "collections-leaf": "Leaf",
    "extras-internship": "Internship",
    "extras-recommendation": "Recommendations",
    "extras-ai_slop": "AI-slop"
  };

  if (names[category]) {
    return names[category];
  }

  return category
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function renderFilters() {

  filtersContainer.innerHTML = "";

  const allButton = createFilterButton(
    "all",
    `All · ${books.length}`
  );

  filtersContainer.appendChild(allButton);

  getCategories().forEach(category => {

    const count = books.filter(
      book => book.category === category
    ).length;

    const button = createFilterButton(
      category,
      `${formatCategory(category)} · ${count}`
    );

    filtersContainer.appendChild(button);
  });
}

function createFilterButton(category, label) {

  const button = document.createElement("button");

  button.className = "filter";

  if (category === activeCategory) {
    button.classList.add("active");
  }

  button.textContent = label;

  button.addEventListener("click", () => {

    activeCategory = category;

    renderFilters();
    renderBooks();

  });

  return button;
}

/* =========================================
   Filtering
   ========================================= */

function getFilteredBooks() {

  return books.filter(book => {

    const matchesCategory =
      activeCategory === "all" ||
      book.category === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const searchableText = `
      ${book.title}
      ${book.description}
      ${book.category}
    `.toLowerCase();

    return searchableText.includes(searchQuery);
  });

}

/* =========================================
   Cards
   ========================================= */

const glowColors = [
  "#818cf8",
  "#a78bfa",
  "#38bdf8",
  "#34d399",
  "#fb7185",
  "#fbbf24"
];

function renderBooks() {

  const filteredBooks = getFilteredBooks();

  booksGrid.innerHTML = "";

  bookCount.textContent = books.length;

  resultCount.textContent =
    `${filteredBooks.length} ${
      filteredBooks.length === 1 ? "work" : "works"
    }`;

  sectionTitle.textContent =
    activeCategory === "all"
      ? "All works"
      : formatCategory(activeCategory);

  if (filteredBooks.length === 0) {

    emptyState.classList.remove("hidden");

    return;
  }

  emptyState.classList.add("hidden");

  filteredBooks.forEach((book, index) => {

    const card = document.createElement("article");

    card.className = "book-card";

    card.style.setProperty(
      "--card-glow",
      glowColors[index % glowColors.length]
    );

    card.innerHTML = `

      <div class="book-top">

        <span class="book-category">
          ${escapeHTML(formatCategory(book.category))}
        </span>

        <span class="book-number">
          ${String(index + 1).padStart(2, "0")}
        </span>

      </div>

      <h3 class="book-title">
        ${escapeHTML(book.title)}
      </h3>

      <p class="book-description">
        ${escapeHTML(book.description)}
      </p>

      <a
        class="book-link"
        href="${escapeAttribute(book.link)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open collection
        <span>↗</span>
      </a>

    `;

    booksGrid.appendChild(card);
  });

}

/* =========================================
   Search
   ========================================= */

searchInput.addEventListener("input", event => {

  searchQuery = event.target.value
    .trim()
    .toLowerCase();

  renderBooks();

});

/* =========================================
   Security helpers
   ========================================= */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function escapeAttribute(value) {

  return escapeHTML(value);

}

/* =========================================
   Init
   ========================================= */

footerYear.textContent =
  new Date().getFullYear();

renderFilters();
renderBooks();
