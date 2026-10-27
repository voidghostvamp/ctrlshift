```javascript
/* =========================================
   CtrlShift — Developer Utilities
   File: script.js
   No database. No backend. No paid APIs.
========================================= */

"use strict";

/* ---------- STORAGE ---------- */

const storage = {
    get(key, fallback = []) {
        try {
            const value = localStorage.getItem("ctrlshift_" + key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem("ctrlshift_" + key, JSON.stringify(value));
        } catch {
            // The app still works if browser storage is unavailable.
        }
    }
};

let favorites = storage.get("favorites", []);
let recentTools = storage.get("recent", []);
let currentTool = null;
let currentCategory = "all";
let currentPage = "dashboard";
let searchQuery = "";


/* ---------- TOOL DIRECTORY ---------- */

const tools = [
    {
        id: "json",
        name: "JSON Formatter",
        description: "Format, validate and inspect JSON data.",
        category: "code",
        icon: "{ }",
        type: "json"
    },
    {
        id: "html-entities",
        name: "HTML Entity Converter",
        description: "Encode and decode HTML special characters.",
        category: "code",
        icon: "</>",
        type: "html-entities"
    },
    {
        id: "number-base",
        name: "Number Base Converter",
        description: "Convert binary, decimal and hexadecimal numbers.",
        category: "code",
        icon: "01",
        type: "number-base"
    },
    {
        id: "text-case",
        name: "Text Case Converter",
        description: "Convert text into different letter cases.",
        category: "text",
        icon: "Aa",
        type: "text-case"
    },
    {
        id: "text-stats",
        name: "Text Counter",
        description: "Count words, characters, lines and sentences.",
        category: "text",
        icon: "T",
        type: "text-stats"
    },
    {
        id: "duplicate-lines",
        name: "Duplicate Line Remover",
        description: "Remove repeated lines from text.",
        category: "text",
        icon: "≡",
        type: "duplicate-lines"
    },
    {
        id: "find-replace",
        name: "Find & Replace",
        description: "Find words and replace matching text.",
        category: "text",
        icon: "⌕",
        type: "find-replace"
    },
    {
        id: "base64",
        name: "Base64 Converter",
        description: "Encode and decode text using Base64.",
        category: "web",
        icon: "B64",
        type: "base64"
    },
    {
        id: "url",
        name: "URL Encoder",
        description: "Encode and decode URL components.",
        category: "web",
        icon: "↗",
        type: "url"
    },
    {
        id: "query",
        name: "Query String Parser",
        description: "Inspect parameters from a URL query string.",
        category: "web",
        icon: "?=",
        type: "query"
    },
    {
        id: "timestamp",
        name: "Timestamp Converter",
        description: "Convert Unix timestamps into readable dates.",
        category: "web",
        icon: "◷",
        type: "timestamp"
    },
    {
        id: "password",
        name: "Password Generator",
        description: "Generate random passwords in your browser.",
        category: "generators",
        icon: "✳",
        type: "password"
    },
    {
        id: "uuid",
        name: "UUID Generator",
        description: "Generate random version 4 UUIDs.",
        category: "generators",
        icon: "ID",
        type: "uuid"
    },
    {
        id: "lorem",
        name: "Lorem Ipsum Generator",
        description: "Generate placeholder text for designs.",
        category: "generators",
        icon: "¶",
        type: "lorem"
    },
    {
        id: "random",
        name: "Random Number Generator",
        description: "Generate random integers in a chosen range.",
        category: "generators",
        icon: "🎲",
        type: "random"
    },
    {
        id: "color",
        name: "Color Converter",
        description: "Convert HEX, RGB and HSL color values.",
        category: "colors",
        icon: "#",
        type: "color"
    },
    {
        id: "gradient",
        name: "CSS Gradient Generator",
        description: "Build gradients and copy the CSS.",
        category: "colors",
        icon: "◐",
        type: "gradient"
    },
    {
        id: "contrast",
        name: "Contrast Checker",
        description: "Check text contrast against a background.",
        category: "colors",
        icon: "◑",
        type: "contrast"
    },
    {
        id: "units",
        name: "Storage Unit Converter",
        description: "Convert bytes, KB, MB and GB.",
        category: "web",
        icon: "⇄",
        type: "units"
    },
    {
        id: "percentage",
        name: "Percentage Calculator",
        description: "Calculate percentages and percentage changes.",
        category: "generators",
        icon: "%",
        type: "percentage"
    }
];

const categoryNames = {
    all: "All Tools",
    code: "Code Tools",
    text: "Text Tools",
    web: "Web Tools",
    generators: "Generators",
    colors: "Color Tools"
};


/* ---------- ELEMENT HELPERS ---------- */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getTool(id) {
    return tools.find(tool => tool.id === id);
}

function getInput(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
}

function setOutput(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
}

function setMessage(id, message, isError = false) {
    const element = document.getElementById(id);
    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

function makeTextarea(id, placeholder, value = "") {
    return `
        <label class="tool-label" for="${id}">
            Input
        </label>
        <textarea
            class="tool-textarea"
            id="${id}"
            placeholder="${escapeHTML(placeholder)}"
            spellcheck="false"
        >${escapeHTML(value)}</textarea>
    `;
}

function makeOutput(id = "tool-output") {
    return `
        <label class="tool-label" for="${id}">
            Output
        </label>
        <pre class="tool-output" id="${id}"></pre>
    `;
}

function makePanel(title, description, content) {
    return `
        <div class="tool-panel">
            <h2>${escapeHTML(title)}</h2>
            <p>${escapeHTML(description)}</p>
            ${content}
        </div>
    `;
}

function makeButton(label, action, primary = false) {
    return `
        <button
            class="${primary ? "primary-button" : "secondary-button"}"
            data-action="${action}"
            type="button"
        >${escapeHTML(label)}</button>
    `;
}

function makeSelect(id, options) {
    return `
        <select class="tool-select" id="${id}">
            ${options.map(option => `
                <option value="${escapeHTML(option[0])}">
                    ${escapeHTML(option[1])}
                </option>
            `).join("")}
        </select>
    `;
}


/* ---------- TOOL CARDS ---------- */

function createToolCard(tool) {
    const isFavorite = favorites.includes(tool.id);

    const card = document.createElement("article");
    card.className = "tool-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${tool.name}`);

    card.innerHTML = `
        <div class="tool-card-icon">${escapeHTML(tool.icon)}</div>

        <button
            type="button"
            class="card-favorite ${isFavorite ? "is-favorite" : ""}"
            data-favorite="${escapeHTML(tool.id)}"
            aria-label="${isFavorite ? "Remove from" : "Add to"} favorites"
            aria-pressed="${isFavorite}"
            title="${isFavorite ? "Remove favorite" : "Add favorite"}"
        >${isFavorite ? "★" : "☆"}</button>

        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.description)}</p>

        <div class="card-bottom">
            <span class="tool-category">
                ${escapeHTML(categoryNames[tool.category])}
            </span>
            <span class="open-arrow">↗</span>
        </div>
    `;

    card.dataset.tool = tool.id;

    return card;
}

function renderToolGrid(container, list) {
    if (!container) return;

    container.replaceChildren();

    list.forEach(tool => {
        container.appendChild(createToolCard(tool));
    });
}

function updateCounts() {
    $("#total-tools").textContent = tools.length;
    $("#favorite-count").textContent = favorites.length;
    $("#recent-count").textContent = recentTools.length;

    const navCount = $('[data-category="all"] .nav-count');
    if (navCount) navCount.textContent = tools.length;
}


/* ---------- DASHBOARD ---------- */

function renderDashboard() {
    const query = searchQuery.trim().toLowerCase();

    let list = tools.filter(tool => {
        const matchesCategory =
            currentCategory === "all" ||
            tool.category === currentCategory;

        const matchesSearch =
            !query ||
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            categoryNames[tool.category].toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    renderToolGrid($("#tool-grid"), list);

    $("#result-count").textContent =
        `${list.length} tool${list.length === 1 ? "" : "s"}`;

    $("#tools-heading").textContent =
        query ? "Search results" :
        currentCategory === "all" ? "Explore tools" :
        categoryNames[currentCategory];

    $("#tools-description").textContent =
        query ? `Results for "${searchQuery.trim()}"` :
        "Small tools that make a big difference.";

    $("#no-results").classList.toggle("hidden", list.length !== 0);
    $("#tool-grid").classList.toggle("hidden", list.length === 0);

    $$(".filter-chip").forEach(button => {
        const active = button.dataset.filter === currentCategory;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    renderToolGrid(
        $("#favorite-tools"),
        favorites.map(getTool).filter(Boolean).slice(0, 3)
    );

    renderToolGrid(
        $("#favorites-page-grid"),
        favorites.map(getTool).filter(Boolean)
    );

    renderToolGrid(
        $("#recent-tools-grid"),
        recentTools.map(getTool).filter(Boolean)
    );

    $("#favorites-empty").classList.toggle("hidden", favorites.length > 0);
    $("#recent-empty").classList.toggle("hidden", recentTools.length > 0);

    $("#favorites-page-grid").classList.toggle("hidden", favorites.length === 0);
    $("#recent-tools-grid").classList.toggle("hidden", recentTools.length === 0);

    updateCounts();
}


/* ---------- NAVIGATION ---------- */

function showPage(page) {
    currentPage = page;

    $$(".page").forEach(section => {
        section.classList.add("hidden");
        section.classList.remove("active");
    });

    const pageElement = $(`#${page}-page`);

    if (pageElement) {
        pageElement.classList.remove("hidden");
        pageElement.classList.add("active");
    }

    const names = {
        dashboard: "Dashboard",
        tool: currentTool ? currentTool.name : "Tool",
        favorites: "Favorites",
        recent: "Recently Used"
    };

    $("#breadcrumb-current").textContent = names[page] || "Dashboard";

    $$(".nav-link").forEach(button => {
        const isActive =
            (page === "dashboard" && button.dataset.page === "dashboard") ||
            (page === "favorites" && button.dataset.page === "favorites") ||
            (page === "recent" && button.dataset.page === "recent") ||
            (page === "dashboard" &&
                button.dataset.category === currentCategory &&
                !button.dataset.page);

        button.classList.toggle("active", Boolean(isActive));
    });

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goDashboard() {
    currentTool = null;
    showPage("dashboard");
}

function openCategory(category) {
    currentCategory = category;
    searchQuery = "";
    $("#tool-search").value = "";

    renderDashboard();
    showPage("dashboard");
}

function openTool(id) {
    const tool = getTool(id);
    if (!tool) return;

    currentTool = tool;

    recentTools = [
        id,
        ...recentTools.filter(item => item !== id)
    ].slice(0, 8);

    storage.set("recent", recentTools);

    $("#workspace-icon").textContent = tool.icon;
    $("#workspace-title").textContent = tool.name;
    $("#workspace-description").textContent = tool.description;
    $("#workspace-category").textContent = categoryNames[tool.category].toUpperCase();

    updateFavoriteButton();
    renderWorkspace(tool);

    showPage("tool");
    renderDashboard();
}

function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
}


/* ---------- FAVORITES ---------- */

function toggleFavorite(id) {
    if (!getTool(id)) return;

    if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
    } else {
        favorites = [...favorites, id];
    }

    storage.set("favorites", favorites);

    renderDashboard();
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!currentTool) return;

    const button = $("#workspace-favorite");
    const active = favorites.includes(currentTool.id);

    button.classList.toggle("is-favorite", active);
    button.textContent = active ? "★" : "☆";
    button.title = active ? "Remove from favorites" : "Add to favorites";
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
        "aria-label",
        active ? "Remove from favorites" : "Add to favorites"
    );
}


/* ---------- WORKSPACE RENDERER ---------- */

function renderWorkspace(tool) {
    const workspace = $("#tool-workspace");
    workspace.replaceChildren();

    // Templates contain only trusted, locally defined tool interfaces.
    const templates = {
        json: () => makePanel(
            "JSON Formatter & Validator",
            "Paste JSON below to format it or check its validity.",
            makeTextarea("json-input", '{"name":"CtrlShift","tools":["JSON","Text"]}') +
            `<div class="tool-actions">
                ${makeButton("Format JSON", "json-format", true)}
                ${makeButton("Minify JSON", "json-minify")}
                ${makeButton("Validate", "json-validate")}
                ${makeButton("Clear", "clear-input")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        "html-entities": () => makePanel(
            "HTML Entity Converter",
            "Convert special characters to entities and back.",
            makeTextarea("text-input", 'Example: <h1>Hello & "welcome"</h1>') +
            `<div class="tool-actions">
                ${makeButton("Encode", "html-encode", true)}
                ${makeButton("Decode", "html-decode")}
                ${makeButton("Clear", "clear-input")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        "number-base": () => makePanel(
            "Number Base Converter",
            "Convert an integer between number bases.",
            `<div class="tool-form-group">
                <label class="tool-label" for="base-input">Number</label>
                <input class="tool-input" id="base-input" value="255" placeholder="Enter an integer">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="base-from">Input base</label>
                ${makeSelect("base-from", [["10","Decimal"],["2","Binary"],["8","Octal"],["16","Hexadecimal"]])}
            </div>
            <div class="tool-actions">
                ${makeButton("Convert", "number-base", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        "text-case": () => makePanel(
            "Text Case Converter",
            "Change the letter case of your text.",
            makeTextarea("text-input", "Enter your text here...") +
            `<div class="tool-form-group">
                <label class="tool-label" for="case-type">Conversion</label>
                ${makeSelect("case-type", [
                    ["upper","UPPERCASE"],
                    ["lower","lowercase"],
                    ["title","Title Case"],
                    ["sentence","Sentence case"],
                    ["camel","camelCase"],
                    ["pascal","PascalCase"],
                    ["snake","snake_case"],
                    ["kebab","kebab-case"]
                ])}
            </div>
            <div class="tool-actions">
                ${makeButton("Convert text", "text-case", true)}
                ${makeButton("Clear", "clear-input")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        "text-stats": () => makePanel(
            "Text Counter",
            "Instantly calculate statistics about your text.",
            makeTextarea("text-input", "Paste or type text here...") +
            `<div class="tool-actions">
                ${makeButton("Count text", "text-stats", true)}
                ${makeButton("Clear", "clear-input")}
            </div>` +
            makeOutput()
        ),

        "duplicate-lines": () => makePanel(
            "Duplicate Line Remover",
            "Remove duplicate lines while preserving their first occurrence.",
            makeTextarea("text-input", "Apple\nBanana\nApple\nOrange") +
            `<div class="tool-actions">
                ${makeButton("Remove duplicates", "duplicate-lines", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        "find-replace": () => makePanel(
            "Find & Replace",
            "Replace matching text in your input.",
            makeTextarea("text-input", "Type your text here...") +
            `<div class="tool-form-group">
                <label class="tool-label" for="find-input">Find</label>
                <input class="tool-input" id="find-input" placeholder="Text to find">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="replace-input">Replace with</label>
                <input class="tool-input" id="replace-input" placeholder="Replacement text">
            </div>
            <div class="tool-actions">
                ${makeButton("Replace all", "find-replace", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        base64: () => makePanel(
            "Base64 Encoder / Decoder",
            "Encode text or decode Base64 back into UTF-8 text.",
            makeTextarea("text-input", "Enter text or Base64...") +
            `<div class="tool-actions">
                ${makeButton("Encode", "base64-encode", true)}
                ${makeButton("Decode", "base64-decode")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        url: () => makePanel(
            "URL Encoder / Decoder",
            "Encode URL components or decode encoded text.",
            makeTextarea("text-input", "https://example.com/search?q=hello world") +
            `<div class="tool-actions">
                ${makeButton("Encode", "url-encode", true)}
                ${makeButton("Decode", "url-decode")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        query: () => makePanel(
            "Query String Parser",
            "Extract and inspect URL query parameters.",
            makeTextarea("text-input", "https://example.com/search?q=hello&page=2") +
            `<div class="tool-actions">
                ${makeButton("Parse query", "query-parse", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        timestamp: () => makePanel(
            "Timestamp Converter",
            "Convert Unix timestamps and date strings.",
            `<div class="tool-form-group">
                <label class="tool-label" for="timestamp-input">Unix timestamp or date</label>
                <input class="tool-input" id="timestamp-input" placeholder="e.g. 1700000000 or 2026-01-01">
            </div>
            <div class="tool-actions">
                ${makeButton("Convert to date", "timestamp-date", true)}
                ${makeButton("Current timestamp", "timestamp-now")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        password: () => makePanel(
            "Password Generator",
            "Generate random passwords locally. Generated passwords are not saved by CtrlShift.",
            `<div class="tool-form-group">
                <label class="tool-label" for="password-length">Password length</label>
                <input class="tool-input" id="password-length" type="number" min="8" max="128" value="20">
            </div>
            <div class="tool-form-group">
                <label class="tool-label"><input type="checkbox" id="password-upper" checked> Uppercase letters (A–Z)</label>
                <label class="tool-label"><input type="checkbox" id="password-lower" checked> Lowercase letters (a–z)</label>
                <label class="tool-label"><input type="checkbox" id="password-numbers" checked> Numbers (0–9)</label>
                <label class="tool-label"><input type="checkbox" id="password-symbols" checked> Symbols</label>
            </div>
            <div class="tool-actions">
                ${makeButton("Generate password", "password-generate", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        uuid: () => makePanel(
            "UUID v4 Generator",
            "Generate random identifiers using the browser's cryptographic random generator.",
            `<div class="tool-actions">
                ${makeButton("Generate UUID", "uuid-generate", true)}
                ${makeButton("Generate 10", "uuid-batch")}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        lorem: () => makePanel(
            "Lorem Ipsum Generator",
            "Generate placeholder paragraphs for layouts and prototypes.",
            `<div class="tool-form-group">
                <label class="tool-label" for="lorem-count">Paragraphs</label>
                <input class="tool-input" id="lorem-count" type="number" min="1" max="20" value="3">
            </div>
            <div class="tool-actions">
                ${makeButton("Generate text", "lorem-generate", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        random: () => makePanel(
            "Random Number Generator",
            "Generate random integers within your chosen range.",
            `<div class="tool-form-group">
                <label class="tool-label" for="random-min">Minimum</label>
                <input class="tool-input" id="random-min" type="number" value="1">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="random-max">Maximum</label>
                <input class="tool-input" id="random-max" type="number" value="100">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="random-count">How many?</label>
                <input class="tool-input" id="random-count" type="number" min="1" max="100" value="1">
            </div>
            <div class="tool-actions">
                ${makeButton("Generate", "random-generate", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        color: () => makePanel(
            "Color Converter",
            "Enter a HEX color to get its RGB and HSL values.",
            `<div class="tool-form-group">
                <label class="tool-label" for="color-input">HEX color</label>
                <input class="tool-input" id="color-input" value="#ffffff" placeholder="#ffffff">
            </div>
            <div class="tool-actions">
                ${makeButton("Convert color", "color-convert", true)}
                ${makeButton("Random color", "color-random")}
                ${makeButton("Copy output", "copy-output")}
            </div>
            <div id="color-preview" style="height:90px;border:1px solid var(--border);border-radius:8px;margin-top:16px;background:#ffffff"></div>` +
            makeOutput() +
            `<div class="tool-message" id="tool-message" aria-live="polite"></div>`
        ),

        gradient: () => makePanel(
            "CSS Gradient Generator",
            "Customize two colors and an angle, then generate CSS.",
            `<div class="tool-form-group">
                <label class="tool-label" for="gradient-a">First color</label>
                <input class="tool-input" id="gradient-a" type="color" value="#111111">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="gradient-b">Second color</label>
                <input class="tool-input" id="gradient-b" type="color" value="#777777">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="gradient-angle">Angle (degrees)</label>
                <input class="tool-input" id="gradient-angle" type="number" min="0" max="360" value="135">
            </div>
            <div id="gradient-preview" style="height:140px;border:1px solid var(--border);border-radius:8px;background:linear-gradient(135deg,#111111,#777777)"></div>
            <div class="tool-actions">
                ${makeButton("Generate CSS", "gradient-generate", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        contrast: () => makePanel(
            "Contrast Checker",
            "Check contrast ratios for text and background colors against WCAG guidelines.",
            `<div class="tool-form-group">
                <label class="tool-label" for="contrast-fg">Text color</label>
                <input class="tool-input" id="contrast-fg" type="color" value="#ffffff">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="contrast-bg">Background color</label>
                <input class="tool-input" id="contrast-bg" type="color" value="#111111">
            </div>
            <div id="contrast-preview" style="padding:25px;text-align:center;border-radius:8px;background:#111111;color:#ffffff;border:1px solid var(--border)">Sample text preview</div>
            <div class="tool-actions">
                ${makeButton("Check contrast", "contrast-check", true)}
            </div>` +
            makeOutput()
        ),

        units: () => makePanel(
            "Storage Unit Converter",
            "Convert storage sizes using decimal (1000) or binary (1024) units.",
            `<div class="tool-form-group">
                <label class="tool-label" for="unit-value">Value</label>
                <input class="tool-input" id="unit-value" type="number" min="0" value="1">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="unit-from">Convert from</label>
                ${makeSelect("unit-from", [["B","Bytes"],["KB","KB"],["MB","MB"],["GB","GB"],["TB","TB"],["KiB","KiB"],["MiB","MiB"],["GiB","GiB"],["TiB","TiB"]])}
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="unit-to">Convert to</label>
                ${makeSelect("unit-to", [["B","Bytes"],["KB","KB"],["MB","MB"],["GB","GB"],["TB","TB"],["KiB","KiB"],["MiB","MiB"],["GiB","GiB"],["TiB","TiB"]])}
            </div>
            <div class="tool-actions">
                ${makeButton("Convert", "units-convert", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        ),

        percentage: () => makePanel(
            "Percentage Calculator",
            "Calculate what a percentage of a number equals.",
            `<div class="tool-form-group">
                <label class="tool-label" for="percentage-rate">Percentage (%)</label>
                <input class="tool-input" id="percentage-rate" type="number" value="15">
            </div>
            <div class="tool-form-group">
                <label class="tool-label" for="percentage-number">Number</label>
                <input class="tool-input" id="percentage-number" type="number" value="200">
            </div>
            <div class="tool-actions">
                ${makeButton("Calculate", "percentage-calculate", true)}
                ${makeButton("Copy output", "copy-output")}
            </div>` +
            makeOutput()
        )
    };

    workspace.innerHTML = templates[tool.type]();
    updateCounts();
}


/* ---------- OUTPUT HELPERS ---------- */

function getOutputText() {
    const output = $("#tool-output");
    return output ? output.textContent : "";
}

async function copyOutput() {
    const text = getOutputText();

    if (!text) {
        setMessage("tool-message", "There is no output to copy.", true);
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        setMessage("tool-message", "Output copied to clipboard.");
    } catch {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const success = document.execCommand("copy");
        temporary.remove();

        setMessage(
            "tool-message",
            success ? "Output copied to clipboard." :
                "Copy failed. Select and copy the output manually.",
            !success
        );
    }
}

function clearInput() {
    const input = $("#text-input") || $("#json-input");

    if (input) input.value = "";

    const output = $("#tool-output");
    if (output) output.textContent = "";

    setMessage("tool-message", "");
}


/* ---------- HTML ENTITIES ---------- */

function encodeEntities(text) {
    return text.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function decodeEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
}


/* ---------- TEXT CASE CONVERSION ---------- */

function wordsFromText(text) {
    return text
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        .match(/[\p{L}\p{N}]+/gu) || [];
}

function convertCase(text, type) {
    const words = wordsFromText(text);
    const lower = words.map(word => word.toLowerCase());

    switch (type) {
        case "upper":
            return text.toUpperCase();

        case "lower":
            return text.toLowerCase();

        case "title":
            return text.replace(/\b[\p{L}\p{N}]+/gu, word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );

        case "sentence":
            return text.toLowerCase().replace(
                /(^\s*\p{L}|[.!?]\s+\p{L})/gu,
                match => match.toUpperCase()
            );

        case "camel":
            return lower.map((word, index) =>
                index === 0 ? word :
                    word.charAt(0).toUpperCase() + word.slice(1)
            ).join("");

        case "pascal":
            return lower.map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join("");

        case "snake":
            return lower.join("_");

        case "kebab":
            return lower.join("-");

        default:
            return text;
    }
}


/* ---------- RANDOMNESS ---------- */

function secureRandomInt(min, max) {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        throw new Error("Please enter valid whole numbers.");
    }

    if (max < min) {
        throw new Error("Maximum must be at least the minimum.");
    }

    if (min === max) return min;

    const range = max - min + 1;

    if (!Number.isSafeInteger(range) || range <= 0) {
        throw new Error("The requested range is too large.");
    }

    const limit = Math.floor(4294967296 / range) * range;
    const array = new Uint32Array(1);

    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);

    return min + (array[0] % range);
}

function secureRandomString(characters, length) {
    if (!characters.length) {
        throw new Error("Select at least one character type.");
    }

    const chars = [...characters];
    const output = [];

    for (let i = 0; i < length; i++) {
        output.push(chars[secureRandomInt(0, chars.length - 1)]);
    }

    return output.join("");
}

function createUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map(byte =>
        byte.toString(16).padStart(2, "0")
    ).join("");

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
    ].join("-");
}


/* ---------- COLOR HELPERS ---------- */

function parseHex(hex) {
    let value = hex.trim().replace(/^#/, "");

    if (/^[0-9a-f]{3}$/i.test(value)) {
        value = value.split("").map(char => char + char).join("");
    }

    if (!/^[0-9a-f]{6}$/i.test(value)) {
        throw new Error("Enter a valid HEX color, such as #ffffff.");
    }

    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16)
    };
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case r:
                h = ((g - b) / delta) % 6;
                break;
            case g:
                h = (b - r) / delta + 2;
                break;
            default:
                h = (r - g) / delta + 4;
        }

        h *= 60;
        if (h < 0) h += 360;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function linearizeColor(value) {
    value /= 255;

    return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
}

function luminance({ r, g, b }) {
    return (
        0.2126 * linearizeColor(r) +
        0.7152 * linearizeColor(g) +
        0.0722 * linearizeColor(b)
    );
}


/* ---------- MAIN TOOL ACTIONS ---------- */

function runAction(action) {
    const input = getInput("text-input");
    const output = $("#tool-output");

    if (!output && action !== "clear-input") return;

    try {
        switch (action) {

            case "json-format":
            case "json-minify":
            case "json-validate": {
                const value = JSON.parse(getInput("json-input"));

                if (action === "json-validate") {
                    output.textContent = "Valid JSON.";
                } else {
                    output.textContent = action === "json-minify"
                        ? JSON.stringify(value)
                        : JSON.stringify(value, null, 2);
                }

                setMessage("tool-message", "JSON is valid.");
                break;
            }

            case "html-encode":
                output.textContent = encodeEntities(input);
                break;

            case "html-decode":
                output.textContent = decodeEntities(input);
                break;

            case "number-base": {
                const base = Number(getInput("base-from"));
                const raw = getInput("base-input").trim();

                const prefixes = {
                    2: /^-?0b/i,
                    8: /^-?0o/i,
                    16: /^-?0x/i
                };

                const clean = raw.replace(/_/g, "");

                if (!clean) throw new Error("Enter a number.");

                const sign = clean.startsWith("-") ? -1 : 1;
                let digits = clean.replace(/^[+-]/, "");

                if (prefixes[base]) {
                    digits = digits.replace(prefixes[base], "");
                }

                const valid = {
                    2: /^[01]+$/,
                    8: /^[0-7]+$/,
                    10: /^\d+$/,
                    16: /^[0-9a-f]+$/i
                };

                if (!valid[base].test(digits)) {
                    throw new Error("The number contains digits invalid for its base.");
                }

                const value = sign * parseInt(digits, base);

                if (!Number.isSafeInteger(value)) {
                    throw new Error("Number is outside the safe integer range.");
                }

                output.textContent =
                    `Decimal: ${value}\n` +
                    `Binary: ${value.toString(2)}\n` +
                    `Octal: ${value.toString(8)}\n` +
                    `Hexadecimal: ${value.toString(16).toUpperCase()}`;

                break;
            }

            case "text-case":
                output.textContent = convertCase(
                    input,
                    getInput("case-type")
                );
                break;

            case "text-stats": {
                const words = input.trim()
                    ? input.trim().split(/\s+/u).length
                    : 0;

                const characters = [...input].length;
                const noSpaces = [...input.replace(/\s/g, "")].length;
                const lines = input.length ? input.split(/\r\n|\r|\n/).length : 0;

                const sentences = input.trim()
                    ? (input.match(/[.!?]+(?=\s|$)/g) || []).length
                    : 0;

                output.textContent =
                    `Words: ${words}\n` +
                    `Characters: ${characters}\n` +
                    `Characters without whitespace: ${noSpaces}\n` +
                    `Lines: ${lines}\n` +
                    `Sentences (approximate): ${sentences}`;

                break;
            }

            case "duplicate-lines": {
                const lines = input.split(/\r\n|\r|\n/);
                const seen = new Set();

                const unique = lines.filter(line => {
                    if (seen.has(line)) return false;
                    seen.add(line);
                    return true;
                });

                output.textContent = unique.join("\n");
                setMessage(
                    "tool-message",
                    `Removed ${lines.length - unique.length} duplicate line(s).`
                );
                break;
            }

            case "find-replace": {
                const find = getInput("find-input");
                const replacement = getInput("replace-input");

                if (!find) throw new Error("Enter text to find.");

                output.textContent = input.split(find).join(replacement);
                break;
            }

            case "base64-encode":
                output.textContent = btoa(
                    Array.from(new TextEncoder().encode(input))
                        .map(byte => String.fromCharCode(byte))
                        .join("")
                );
                break;

            case "base64-decode": {
                const binary = atob(input.trim());
                const bytes = Uint8Array.from(
                    binary,
                    character => character.charCodeAt(0)
                );

                output.textContent = new TextDecoder("utf-8", {
                    fatal: true
                }).decode(bytes);

                break;
            }

            case "url-encode":
                output.textContent = encodeURIComponent(input);
                break;

            case "url-decode":
                output.textContent = decodeURIComponent(input);
                break;

            case "query-parse": {
                let url;

                try {
                    url = new URL(input.trim());
                } catch {
                    url = new URL(
                        "https://local.invalid/?" +
                        input.trim().replace(/^[?&]/, "")
                    );
                }

                const entries = [...url.searchParams.entries()];

                output.textContent = entries.length
                    ? entries.map(([key, value]) =>
                        `${key}: ${value}`
                    ).join("\n")
                    : "No query parameters found.";

                break;
            }

            case "timestamp-date": {
                const raw = getInput("timestamp-input").trim();
                if (!raw) throw new Error("Enter a timestamp or date.");

                const date = /^\d+$/.test(raw)
                    ? new Date(Number(raw) * (raw.length <= 10 ? 1000 : 1))
                    : new Date(raw);

                if (Number.isNaN(date.getTime())) {
                    throw new Error("Enter a valid timestamp or date.");
                }

                output.textContent =
                    `UTC: ${date.toISOString()}\n` +
                    `Local time: ${date.toString()}\n` +
                    `Unix seconds: ${Math.floor(date.getTime() / 1000)}\n` +
                    `Unix milliseconds: ${date.getTime()}`;

                break;
            }

            case "timestamp-now": {
                const now = new Date();

                output.textContent =
                    `UTC: ${now.toISOString()}\n` +
                    `Local time: ${now.toString()}\n` +
                    `Unix seconds: ${Math.floor(now.getTime() / 1000)}\n` +
                    `Unix milliseconds: ${now.getTime()}`;

                break;
            }

            case "password-generate": {
                const length = Number(getInput("password-length"));

                if (!Number.isInteger(length) || length < 8 || length > 128) {
                    throw new Error("Choose a length between 8 and 128.");
                }

                let characters = "";

                if ($("#password-upper").checked) characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                if ($("#password-lower").checked) characters += "abcdefghijklmnopqrstuvwxyz";
                if ($("#password-numbers").checked) characters += "0123456789";
                if ($("#password-symbols").checked) characters += "!@#$%^&*()-_=+[]{};:,.?";

                if (!characters) {
                    throw new Error("Select at least one character type.");
                }

                // Ensure at least one character from each selected category.
                const groups = [];

                if ($("#password-upper").checked) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                if ($("#password-lower").checked) groups.push("abcdefghijklmnopqrstuvwxyz");
                if ($("#password-numbers").checked) groups.push("0123456789");
                if ($("#password-symbols").checked) groups.push("!@#$%^&*()-_=+[]{};:,.?");

                if (length < groups.length) {
                    throw new Error("Increase the length to include every selected character type.");
                }

                const password = groups.map(group =>
                    group[secureRandomInt(0, group.length - 1)]
                );

                while (password.length < length) {
                    password.push(
                        characters[secureRandomInt(0, characters.length - 1)]
                    );
                }

                // Shuffle the generated characters using cryptographic randomness.
                for (let i = password.length - 1; i > 0; i--) {
                    const j = secureRandomInt(0, i);
                    [password[i], password[j]] = [password[j], password[i]];
                }

                output.textContent = password.join("");
                setMessage("tool-message", "Generated locally. Copy it before leaving this page.");
                break;
            }

            case "uuid-generate":
                output.textContent = createUUID();
                break;

            case "uuid-batch":
                output.textContent = Array.from(
                    { length: 10 },
                    createUUID
                ).join("\n");
                break;

            case "lorem-generate": {
                const count = Number(getInput("lorem-count"));

                if (!Number.isInteger(count) || count < 1 || count > 20) {
                    throw new Error("Choose between 1 and 20 paragraphs.");
                }

                const sample = (
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
                    "Integer vitae justo sed nibh facilisis tincidunt. " +
                    "Donec euismod, neque at interdum feugiat, lectus sapien " +
                    "aliquet libero, sit amet aliquet nulla mauris id nisl. " +
                    "Vivamus non erat sed ipsum finibus tristique. " +
                    "Curabitur at ligula vel neque malesuada pellentesque."
                );

                output.textContent = Array.from(
                    { length: count },
                    () => sample
                ).join("\n\n");

                break;
            }

            case "random-generate": {
                const min = Number(getInput("random-min"));
                const max = Number(getInput("random-max"));
                const count = Number(getInput("random-count"));

                if (!Number.isInteger(count) || count < 1 || count > 100) {
                    throw new Error("Choose between 1 and 100 results.");
                }

                output.textContent = Array.from(
                    { length: count },
                    () => secureRandomInt(min, max)
                ).join("\n");

                break;
            }

            case "color-convert":
            case "color-random": {
                let hex = getInput("color-input").trim();

                if (action === "color-random") {
                    const bytes = new Uint8Array(3);
                    crypto.getRandomValues(bytes);

                    hex = "#" + [...bytes]
                        .map(value => value.toString(16).padStart(2, "0"))
                        .join("");

                    $("#color-input").value = hex;
                }

                const rgb = parseHex(hex);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

                output.textContent =
                    `HEX: #${[rgb.r, rgb.g, rgb.b].map(value =>
                        value.toString(16).padStart(2, "0")
                    ).join("")}\n` +
                    `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\n` +
                    `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

                $("#color-preview").style.background = hex;
                break;
            }

            case "gradient-generate": {
                const a = getInput("gradient-a");
                const b = getInput("gradient-b");
                const angle = Number(getInput("gradient-angle"));

                if (!Number.isFinite(angle) || angle < 0 || angle > 360) {
                    throw new Error("Angle must be between 0 and 360.");
                }

                const css = `linear-gradient(${angle}deg, ${a}, ${b})`;

                $("#gradient-preview").style.background = css;
                output.textContent = `background: ${css};`;

                break;
            }

            case "contrast-check": {
                const fg = parseHex(getInput("contrast-fg"));
                const bg = parseHex(getInput("contrast-bg"));

                const L1 = luminance(fg);
                const L2 = luminance(bg);

                const ratio =
                    (Math.max(L1, L2) + 0.05) /
                    (Math.min(L1, L2) + 0.05);

                const normal = ratio >= 4.5;
                const large = ratio >= 3;
                const enhanced = ratio >= 7;

                const preview = $("#contrast-preview");
                preview.style.color = getInput("contrast-fg");
                preview.style.background = getInput("contrast-bg");

                output.textContent =
                    `Contrast ratio: ${ratio.toFixed(2)}:1\n` +
                    `WCAG AA — normal text (4.5:1): ${normal ? "PASS" : "FAIL"}\n` +
                    `WCAG AA — large text (3:1): ${large ? "PASS" : "FAIL"}\n` +
                    `WCAG AAA — normal text (7:1): ${enhanced ? "PASS" : "FAIL"}`;

                break;
            }

            case "units-convert": {
                const value = Number(getInput("unit-value"));
                const from = getInput("unit-from");
                const to = getInput("unit-to");

                const decimal = {
                    B: 1,
                    KB: 1000,
                    MB: 1000 ** 2,
                    GB: 1000 ** 3,
                    TB: 1000 ** 4
                };

                const binary = {
                    KiB: 1024,
                    MiB: 1024 ** 2,
                    GiB: 1024 ** 3,
                    TiB: 1024 ** 4
                };

                const factors = { ...decimal, ...binary };

                if (!Number.isFinite(value) || value < 0) {
                    throw new Error("Enter a non-negative valid number.");
                }

                const result = value * factors[from] / factors[to];

                output.textContent =
                    `${value} ${from} = ${Number(result.toPrecision(12))} ${to}\n\n` +
                    "KB, MB, GB and TB use powers of 1000.\n" +
                    "KiB, MiB, GiB and TiB use powers of 1024.";

                break;
            }

            case "percentage-calculate": {
                const rate = Number(getInput("percentage-rate"));
                const number = Number(getInput("percentage-number"));

                if (!Number.isFinite(rate) || !Number.isFinite(number)) {
                    throw new Error("Enter valid numbers.");
                }

                output.textContent =
                    `${
