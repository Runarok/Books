/* =========================================================
   RUNAROK BOOKS
   ========================================================= */
const BOOKS_JSON = "https://raw.githubusercontent.com/Runarok/Books/refs/heads/main/Books.json";
const state = {
	books: [],
	mainCategory: "all",
	subCategory: null,
	search: ""
};
/* =========================================================
   ELEMENTS
   ========================================================= */
const booksGrid =
	document.getElementById("booksGrid");
const worksCount =
	document.getElementById("worksCount");
const resultsCount =
	document.getElementById("resultsCount");
const resultsTitle =
	document.getElementById("resultsTitle");
const emptyState =
	document.getElementById("emptyState");
const searchInput =
	document.getElementById("searchInput");
const clearSearch =
	document.getElementById("clearSearch");
const mainCategories =
	document.getElementById("mainCategories");
const subCategories =
	document.getElementById("subCategories");
const themeToggle =
	document.getElementById("themeToggle");
const themeIcon =
	document.getElementById("themeIcon");
/* =========================================================
   CATEGORY STRUCTURE
   =========================================================

   collections-leaf is deliberately treated as a child
   of collections.

   Any future category following:
       parent-child

   will automatically behave similarly.
   ========================================================= */
function getCategoryParts(category) {
	if (!category) {
		return {
			main: "other",
			sub: null
		};
	}
	const parts =
		category.split("-");
	return {
		main: parts[0],
		sub: parts.length > 1 ?
			parts.slice(1).join("-") : null
	};
}
/* =========================================================
   CATEGORY DISPLAY NAMES
   ========================================================= */
function formatCategoryName(category) {
	const names = {
		all: "All",
		thinking: "Thinking",
		expression: "Expression",
		collections: "Collections",
		guides: "Guides",
		extras: "Extras",
		other: "Other",
		leaf: "Leaf",
		internship: "Internship",
		recommendation: "Recommendations",
		"ai_slop": "AI Slop"
	};
	if (names[category]) {
		return names[category];
	}
	return category
		.replaceAll("_", " ")
		.replace(/\b\w/g, char =>
			char.toUpperCase()
		);
}
/* =========================================================
   LOAD BOOKS
   ========================================================= */
async function loadBooks() {
	try {
		const response =
			await fetch(BOOKS_JSON, {
				cache: "no-cache"
			});
		if (!response.ok) {
			throw new Error(
				`HTTP ${response.status}`
			);
		}
		state.books =
			await response.json();
		initialize();
	} catch (error) {
		console.error(
			"Unable to load books.json:",
			error
		);
		booksGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">!</div>
                <h3>Couldn't load the library</h3>
                <p>
                    Make sure books.json is in the same
                    directory as this page.
                </p>
            </div>
        `;
	}
}
/* =========================================================
   INITIALIZE
   ========================================================= */
function initialize() {
	worksCount.textContent =
		state.books.length;
	renderMainCategories();
	renderSubCategories();
	renderBooks();
	setupSearch();
	setupTheme();
}
/* =========================================================
   MAIN CATEGORIES
   ========================================================= */
function getMainCategories() {
	const categories =
		new Set();
	state.books.forEach(book => {
		const {
			main
		} =
		getCategoryParts(book.category);
		categories.add(main);
	});
	return [...categories];
}

function renderMainCategories() {
	mainCategories.innerHTML = "";
	const allButton =
		createCategoryButton(
			"all",
			"All"
		);
	mainCategories.appendChild(
		allButton
	);
	getMainCategories()
		.forEach(category => {
			const button =
				createCategoryButton(
					category,
					formatCategoryName(category)
				);
			mainCategories.appendChild(
				button
			);
		});
}

function createCategoryButton(
	category,
	label
) {
	const button =
		document.createElement("button");
	button.type =
		"button";
	button.className =
		"category-btn";
	button.textContent =
		label;
	if (
		state.mainCategory ===
		category
	) {
		button.classList.add(
			"active"
		);
	}
	button.addEventListener(
		"click",
		() => {
			state.mainCategory =
				category;
			state.subCategory =
				null;
			renderMainCategories();
			renderSubCategories();
			renderBooks();
		}
	);
	return button;
}
/* =========================================================
   SUBCATEGORIES
   ========================================================= */
function getSubCategories(mainCategory) {
	if (
		mainCategory === "all"
	) {
		return [];
	}
	const subCategories =
		new Set();
	state.books.forEach(book => {
		const {
			main,
			sub
		} =
		getCategoryParts(
			book.category
		);
		if (
			main === mainCategory &&
			sub
		) {
			subCategories.add(sub);
		}
	});
	return [...subCategories];
}

function renderSubCategories() {
	subCategories.innerHTML = "";
	if (
		state.mainCategory === "all"
	) {
		subCategories.style.display =
			"none";
		return;
	}
	const children =
		getSubCategories(
			state.mainCategory
		);
	if (!children.length) {
		subCategories.style.display =
			"none";
		return;
	}
	subCategories.style.display =
		"flex";
	children.forEach(sub => {
		const button =
			document.createElement("button");
		button.type =
			"button";
		button.className =
			"subcategory-btn";
		button.textContent =
			formatCategoryName(sub);
		if (
			state.subCategory === sub
		) {
			button.classList.add(
				"active"
			);
		}
		button.addEventListener(
			"click",
			() => {
				if (
					state.subCategory ===
					sub
				) {
					state.subCategory =
						null;
				} else {
					state.subCategory =
						sub;
				}
				renderSubCategories();
				renderBooks();
			}
		);
		subCategories.appendChild(
			button
		);
	});
}
/* =========================================================
   FILTER BOOKS
   ========================================================= */
function getFilteredBooks() {
	const query =
		state.search
		.trim()
		.toLowerCase();
	return state.books.filter(book => {
		const {
			main,
			sub
		} =
		getCategoryParts(
			book.category
		);
		/* Main category */
		if (
			state.mainCategory !==
			"all" &&
			main !==
			state.mainCategory
		) {
			return false;
		}
		/* Subcategory */
		if (
			state.subCategory &&
			sub !==
			state.subCategory
		) {
			return false;
		}
		/* Search */
		if (!query) {
			return true;
		}
		const searchable = [
				book.title,
				book.description,
				book.category
			]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return searchable.includes(
			query
		);
	});
}
/* =========================================================
   RENDER BOOKS
   ========================================================= */
function renderBooks() {
	const books =
		getFilteredBooks();
	booksGrid.innerHTML = "";
	resultsCount.textContent =
		`${books.length} ${
            books.length === 1
                ? "work"
                : "works"
        }`;
	updateResultsTitle();
	if (!books.length) {
		emptyState.hidden =
			false;
		return;
	}
	emptyState.hidden =
		true;
	books.forEach(
		(book, index) => {
			const card =
				createBookCard(
					book,
					index
				);
			booksGrid.appendChild(
				card
			);
		}
	);
}
/* =========================================================
   RESULTS TITLE
   ========================================================= */
function updateResultsTitle() {
	if (
		state.search.trim()
	) {
		resultsTitle.textContent =
			"Search results";
		return;
	}
	if (
		state.subCategory
	) {
		resultsTitle.textContent =
			formatCategoryName(
				state.subCategory
			);
		return;
	}
	if (
		state.mainCategory !==
		"all"
	) {
		resultsTitle.textContent =
			formatCategoryName(
				state.mainCategory
			);
		return;
	}
	resultsTitle.textContent =
		"All works";
}
/* =========================================================
   CARD
   ========================================================= */
function createBookCard(
	book,
	index
) {
	const card =
		document.createElement("article");
	card.className =
		"book-card";
	const {
		main,
		sub
	} =
	getCategoryParts(
		book.category
	);
	const categoryLabel =
		sub ?
		`${formatCategoryName(main)} · ${formatCategoryName(sub)}` :
		formatCategoryName(main);
	const isPDF =
		typeof book.link === "string" &&
		/\.pdf(?:[?#].*)?$/i.test(
			book.link
		);
	const actionLabel =
		isPDF ?
		"View Book" :
		"Browse Folder";
	const safeTitle =
		escapeHTML(
			book.title || "Untitled"
		);
	const safeDescription =
		escapeHTML(
			book.description ||
			"No description available."
		);
	card.innerHTML = `

        <span class="card-category">
            ${escapeHTML(categoryLabel)}
        </span>

        <h3>
            ${safeTitle}
        </h3>

        <p class="book-description">
            ${safeDescription}
        </p>

        <div class="card-footer">

            <span
                class="card-index"
                style="
                    color: var(--text-muted);
                    font-size: .68rem;
                "
            >
                ${String(index + 1).padStart(2, "0")}
            </span>

            <a
                class="book-action"
                href="${escapeAttribute(book.link)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                ${actionLabel}
            </a>

        </div>
    `;
	return card;
}
/* =========================================================
   SEARCH
   ========================================================= */
function setupSearch() {
	searchInput.addEventListener(
		"input",
		event => {
			state.search =
				event.target.value;
			clearSearch.classList.toggle(
				"visible",
				Boolean(
					state.search.trim()
				)
			);
			renderBooks();
		}
	);
	clearSearch.addEventListener(
		"click",
		() => {
			searchInput.value =
				"";
			state.search =
				"";
			clearSearch.classList.remove(
				"visible"
			);
			renderBooks();
			searchInput.focus();
		}
	);
}
/* =========================================================
   THEME
   ========================================================= */
function setupTheme() {
	const savedTheme =
		localStorage.getItem(
			"runarok-theme"
		);
	if (
		savedTheme === "light" ||
		savedTheme === "dark"
	) {
		setTheme(
			savedTheme,
			false
		);
	} else {
		setTheme(
			"dark",
			false
		);
	}
	themeToggle.addEventListener(
		"click",
		() => {
			const current =
				document.body.classList.contains(
					"theme-dark"
				) ?
				"dark" :
				"light";
			const next =
				current === "dark" ?
				"light" :
				"dark";
			setTheme(
				next,
				true
			);
		}
	);
}

function setTheme(
	theme,
	save = true
) {
	/*
	 * Only animate cheap properties.
	 * backdrop-filter itself isn't transitioned.
	 * This keeps the switch visually smooth
	 * without causing a heavy repaint.
	 */
	document.body.classList.remove(
		"theme-dark",
		"theme-light"
	);
	document.body.classList.add(
		`theme-${theme}`
	);
	if (theme === "dark") {
		themeIcon.textContent =
			"☾";
		themeToggle.setAttribute(
			"aria-label",
			"Switch to light theme"
		);
	} else {
		themeIcon.textContent =
			"☀";
		themeToggle.setAttribute(
			"aria-label",
			"Switch to dark theme"
		);
	}
	if (save) {
		localStorage.setItem(
			"runarok-theme",
			theme
		);
	}
}
/* =========================================================
   HTML SAFETY
   ========================================================= */
function escapeHTML(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
	return escapeHTML(
		value || "#"
	);
}
/* =========================================================
   START
   ========================================================= */
loadBooks();