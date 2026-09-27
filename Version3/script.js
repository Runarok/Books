const BOOKS_URL = "./books.json";

const booksGrid = document.getElementById("booksGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const resultCount = document.getElementById("resultCount");
const resultLabel = document.getElementById("resultLabel");
const activeFilter = document.getElementById("activeFilter");

const emptyState = document.getElementById("emptyState");

const themeToggle = document.getElementById("themeToggle");

const scrollLeft = document.getElementById("scrollLeft");
const scrollRight = document.getElementById("scrollRight");

const year = document.getElementById("year");


let books = [];
let activeCategory = "all";


/* -------------------------------- */
/* INITIALIZATION                    */
/* -------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {

  year.textContent = new Date().getFullYear();

  loadTheme();

  await loadBooks();

});


/* -------------------------------- */
/* LOAD JSON                         */
/* -------------------------------- */

async function loadBooks() {

  try {

    const response = await fetch(BOOKS_URL);

    if (!response.ok) {
      throw new Error("Could not load books.json");
    }

    books = await response.json();

    createCategoryTabs();

    renderBooks();

  } catch (error) {

    console.error(error);

    booksGrid.innerHTML = `
      <div class="empty-state" style="display:block; grid-column:1/-1;">
        <div class="empty-icon">!</div>

        <h2>Unable to load library</h2>

        <p>
          Make sure <strong>books.json</strong>
          is in the same folder as this page.
        </p>
      </div>
    `;

  }

}


/* -------------------------------- */
/* CATEGORY HELPERS                  */
/* -------------------------------- */

function parseCategory(category) {

  if (!category) {

    return {
      parent: "uncategorized",
      child: null
    };

  }

  const parts = category.split("-");

  return {
    parent: parts[0],
    child: parts.slice(1).join("-") || null
  };

}


function formatName(name) {

  if (!name) {
    return "";
  }

  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());

}


function getParentCategories() {

  const parents = new Set();

  books.forEach(book => {

    const parsed = parseCategory(book.category);

    parents.add(parsed.parent);

  });

  return [...parents];

}


/* -------------------------------- */
/* CATEGORY TABS                     */
/* -------------------------------- */

function createCategoryTabs() {

  categoryTabs.innerHTML = "";

  const allButton = createCategoryButton(
    "all",
    "All"
  );

  categoryTabs.appendChild(allButton);


  const parents = getParentCategories();

  parents.forEach(parent => {

    const button = createCategoryButton(
      parent,
      formatName(parent)
    );

    categoryTabs.appendChild(button);


    /*
      Create child tabs underneath their parent.

      Example:

      collections
      collections → leaf
    */

    const children = new Set();

    books.forEach(book => {

      const parsed = parseCategory(book.category);

      if (
        parsed.parent === parent &&
        parsed.child
      ) {
        children.add(parsed.child);
      }

    });


    children.forEach(child => {

      const childButton =
        createCategoryButton(
          `${parent}-${child}`,
          `
            <span class="parent-name">
              ${formatName(parent)}
            </span>

            <span class="separator">→</span>

            <span class="child-name">
              ${formatName(child)}
            </span>
          `
        );

      categoryTabs.appendChild(childButton);

    });

  });

}


function createCategoryButton(
  value,
  label
) {

  const button = document.createElement("button");

  button.className = "category-tab";

  button.type = "button";

  button.dataset.category = value;

  button.innerHTML = label;

  if (value === activeCategory) {
    button.classList.add("active");
  }

  button.addEventListener(
    "click",
    () => {

      activeCategory = value;

      document
        .querySelectorAll(".category-tab")
        .forEach(tab => {
          tab.classList.remove("active");
        });

      button.classList.add("active");

      renderBooks();

    }
  );

  return button;

}


/* -------------------------------- */
/* BOOK RENDERING                    */
/* -------------------------------- */

function renderBooks() {

  const searchTerm =
    searchInput.value
      .trim()
      .toLowerCase();


  const filteredBooks =
    books.filter(book => {

      const category =
        book.category || "";

      const categoryMatch =
        activeCategory === "all" ||
        category === activeCategory ||
        parseCategory(category).parent === activeCategory;


      const searchableText = [
        book.title,
        book.description,
        book.category
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const searchMatch =
        !searchTerm ||
        searchableText.includes(searchTerm);


      return categoryMatch && searchMatch;

    });


  booksGrid.innerHTML = "";


  filteredBooks.forEach(
    (book, index) => {

      booksGrid.appendChild(
        createBookCard(book, index)
      );

    }
  );


  updateLibraryInfo(
    filteredBooks.length
  );


  emptyState.hidden =
    filteredBooks.length !== 0;

}


function createBookCard(book, index) {

  const card =
    document.createElement("article");

  card.className = "book-card";


  const parsed =
    parseCategory(book.category);


  const categoryLabel =
    parsed.child
      ? `${formatName(parsed.parent)} · ${formatName(parsed.child)}`
      : formatName(parsed.parent);


  const actionText =
    isPdf(book.link)
      ? "View Book"
      : "Browse Folder";


  card.innerHTML = `

    <div class="book-top">

      <span class="book-category">
        ${escapeHtml(categoryLabel)}
      </span>

      <span class="book-number">
        ${String(index + 1).padStart(2, "0")}
      </span>

    </div>


    <h2>
      ${escapeHtml(book.title)}
    </h2>


    <p>
      ${escapeHtml(book.description || "")}
    </p>


    <div class="book-footer">

      <a
        class="book-link"
        href="${escapeAttribute(book.link)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          ${actionText}
        </span>
      </a>

    </div>

  `;


  return card;

}


/* -------------------------------- */
/* PDF DETECTION                     */
/* -------------------------------- */

function isPdf(link) {

  if (!link) {
    return false;
  }

  /*
    Handles:

    file.pdf
    file.pdf?something
    file.PDF
  */

  return /\.pdf(?:[?#].*)?$/i.test(link);

}


/* -------------------------------- */
/* SEARCH                            */
/* -------------------------------- */

searchInput.addEventListener(
  "input",
  () => {

    const hasSearch =
      searchInput.value.trim().length > 0;

    clearSearch.classList.toggle(
      "visible",
      hasSearch
    );

    renderBooks();

  }
);


clearSearch.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    clearSearch.classList.remove(
      "visible"
    );

    searchInput.focus();

    renderBooks();

  }
);


/* -------------------------------- */
/* LIBRARY INFO                      */
/* -------------------------------- */

function updateLibraryInfo(count) {

  resultCount.textContent = count;

  resultLabel.textContent =
    count === 1
      ? "work"
      : "works";


  if (activeCategory === "all") {

    activeFilter.textContent =
      searchInput.value.trim()
        ? `Searching all works`
        : "All works";

  } else {

    const parsed =
      parseCategory(activeCategory);


    if (parsed.child) {

      activeFilter.textContent =
        `${formatName(parsed.parent)} → ${formatName(parsed.child)}`;

    } else {

      activeFilter.textContent =
        formatName(parsed.parent);

    }

  }

}


/* -------------------------------- */
/* HORIZONTAL CATEGORY SCROLL        */
/* -------------------------------- */

scrollLeft.addEventListener(
  "click",
  () => {

    categoryTabs.scrollBy({
      left: -250,
      behavior: "smooth"
    });

  }
);


scrollRight.addEventListener(
  "click",
  () => {

    categoryTabs.scrollBy({
      left: 250,
      behavior: "smooth"
    });

  }
);


/*
  Allow mouse wheel to move
  horizontally over categories.
*/

categoryTabs.addEventListener(
  "wheel",
  event => {

    if (
      Math.abs(event.deltaY) >
      Math.abs(event.deltaX)
    ) {

      event.preventDefault();

      categoryTabs.scrollLeft +=
        event.deltaY;

    }

  },
  { passive: false }
);


/* -------------------------------- */
/* THEME                             */
/* -------------------------------- */

function loadTheme() {

  const savedTheme =
    localStorage.getItem(
      "runarok-theme"
    );


  if (savedTheme) {

    document.documentElement.dataset.theme =
      savedTheme;

    return;

  }


  /*
    Respect system preference.
  */

  if (
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
  ) {

    document.documentElement.dataset.theme =
      "dark";

  }

}


themeToggle.addEventListener(
  "click",
  () => {

    const current =
      document.documentElement.dataset.theme;


    const next =
      current === "dark"
        ? "light"
        : "dark";


    document.documentElement.dataset.theme =
      next;


    localStorage.setItem(
      "runarok-theme",
      next
    );

  }
);

/* -------------------------------- */
/* HTML SAFETY                       */
/* -------------------------------- */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

}
