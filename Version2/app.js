let books = [];

const booksGrid = document.getElementById("booksGrid");
const filtersContainer = document.getElementById("filters");
const searchInput = document.getElementById("searchInput");

const bookCount = document.getElementById("bookCount");
const resultCount = document.getElementById("resultCount");
const sectionTitle = document.getElementById("sectionTitle");

const emptyState = document.getElementById("emptyState");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const year = document.getElementById("year");

let activeCategory = "all";
let searchQuery = "";


/* =========================================
   Load JSON
========================================= */

async function loadBooks() {

  try {

    const response = await fetch("./books.json");

    if (!response.ok) {
      throw new Error("Unable to load books.json");
    }

    books = await response.json();

    bookCount.textContent = books.length;

    renderFilters();
    renderBooks();

  } catch (error) {

    console.error(error);

    booksGrid.innerHTML = `
      <div class="empty-state">
        <h3>Couldn't load the library.</h3>
        <p>Make sure books.json exists beside this page.</p>
      </div>
    `;
  }
}


/* =========================================
   Theme
========================================= */

function getTheme() {

  const saved =
    localStorage.getItem("runarok-books-theme");

  if (saved) {
    return saved;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}


function setTheme(theme) {

  document.documentElement.dataset.theme = theme;

  localStorage.setItem(
    "runarok-books-theme",
    theme
  );

  themeIcon.textContent =
    theme === "dark" ? "☀" : "☾";
}


setTheme(getTheme());


themeToggle.addEventListener(
  "click",
  () => {

    const current =
      document.documentElement.dataset.theme;

    setTheme(
      current === "dark"
        ? "light"
        : "dark"
    );

  }
);


/* =========================================
   Keyboard search
========================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "/" &&
      document.activeElement !== searchInput
    ) {

      event.preventDefault();

      searchInput.focus();
    }

    if (
      event.key === "Escape" &&
      document.activeElement === searchInput
    ) {

      searchInput.value = "";

      searchQuery = "";

      searchInput.blur();

      renderBooks();
    }

  }
);


/* =========================================
   Categories
========================================= */

function getCategories() {

  return [
    ...new Set(
      books.map(book => book.category)
    )
  ];

}


function formatCategory(category) {

  const names = {

    "collections-leaf": "Leaf",

    "extras-internship": "Internship",

    "extras-recommendation":
      "Recommendations",

    "extras-ai_slop":
      "AI-slop"

  };

  if (names[category]) {
    return names[category];
  }

  return category
    .replace(/[-_]/g, " ")
    .replace(
      /\b\w/g,
      char => char.toUpperCase()
    );

}


function renderFilters() {

  filtersContainer.innerHTML = "";

  filtersContainer.appendChild(
    createFilter(
      "all",
      `All · ${books.length}`
    )
  );

  getCategories().forEach(category => {

    const count =
      books.filter(
        book =>
          book.category === category
      ).length;

    filtersContainer.appendChild(
      createFilter(
        category,
        `${formatCategory(category)} · ${count}`
      )
    );

  });

}


function createFilter(category, label) {

  const button =
    document.createElement("button");

  button.className = "filter";

  if (category === activeCategory) {
    button.classList.add("active");
  }

  button.textContent = label;

  button.addEventListener(
    "click",
    () => {

      activeCategory = category;

      renderFilters();
      renderBooks();

    }
  );

  return button;
}


/* =========================================
   Filtering
========================================= */

function getFilteredBooks() {

  return books.filter(book => {

    const categoryMatch =
      activeCategory === "all" ||
      book.category === activeCategory;

    if (!categoryMatch) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const text = `
      ${book.title}
      ${book.description}
      ${book.category}
    `.toLowerCase();

    return text.includes(searchQuery);

  });

}


/* =========================================
   Link type
========================================= */

function getBookAction(book) {

  const cleanLink =
    book.link
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();

  const isPDF =
    cleanLink.endsWith(".pdf");

  if (isPDF) {

    return {
      label: "View Book",
      icon: "↗"
    };

  }

  return {
    label: "Browse Folder",
    icon: "↗"
  };

}


/* =========================================
   Render
========================================= */

function renderBooks() {

  const filtered =
    getFilteredBooks();

  booksGrid.innerHTML = "";

  resultCount.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "work"
        : "works"
    }`;

  sectionTitle.textContent =
    activeCategory === "all"
      ? "All works"
      : formatCategory(activeCategory);


  if (!filtered.length) {

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }

  emptyState.classList.add(
    "hidden"
  );


  filtered.forEach(
    (book, index) => {

      const action =
        getBookAction(book);

      const card =
        document.createElement("article");

      card.className =
        "book-card";


      card.innerHTML = `

        <div class="book-top">

          <span class="book-category">
            ${escapeHTML(
              formatCategory(book.category)
            )}
          </span>

          <span class="book-number">
            ${String(index + 1)
              .padStart(2, "0")}
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

          ${action.label}

          <span class="arrow">
            ${action.icon}
          </span>

        </a>

      `;


      booksGrid.appendChild(card);

    }
  );

}


/* =========================================
   Search
========================================= */

searchInput.addEventListener(
  "input",
  event => {

    searchQuery =
      event.target.value
        .trim()
        .toLowerCase();

    renderBooks();

  }
);


/* =========================================
   Escape helpers
========================================= */

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================================
   Footer
========================================= */

year.textContent =
  new Date().getFullYear();


/* =========================================
   Start
========================================= */

loadBooks();
