
"use strict";

const STORAGE_KEYS = {
    favorites: "ctrlshift-favorites",
    recent: "ctrlshift-recent",
    theme: "ctrlshift-theme"
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

function readStorage(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));

        if (value === null) return fallback;
        if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;

        return value;
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.warn("Could not save browser data.");
    }
}

let favorites = readStorage(STORAGE_KEYS.favorites, []);
let recentTools = readStorage(STORAGE_KEYS.recent, []);
let activeCategory = "all";
let currentPage = "dashboard";
let currentToolId = null;

const tools = [
    { id: "json-format", name: "JSON Formatter", description: "Format messy JSON into readable, structured data.", category: "code", icon: "{ }", action: "json-format" },
    { id: "json-minify", name: "JSON Minifier", description: "Remove unnecessary whitespace from JSON.", category: "code", icon: "{ }", action: "json-minify" },
    { id: "json-validate", name: "JSON Validator", description: "Check whether your JSON is valid.", category: "code", icon: "✓", action: "json-validate" },
    { id: "regex-tester", name: "Regex Tester", description: "Test regular expressions against sample text.", category: "code", icon: ".*", action: "regex-test" },
    { id: "text-case", name: "Text Case Converter", description: "Convert text to uppercase, lowercase and more.", category: "text", icon: "Aa", action: "text-case" },
    { id: "word-counter", name: "Word Counter", description: "Count words, characters, lines and sentences.", category: "text", icon: "T", action: "word-count" },
    { id: "duplicate-lines", name: "Duplicate Line Remover", description: "Remove repeated lines while preserving order.", category: "text", icon: "≡", action: "duplicate-lines" },
    { id: "text-reverse", name: "Text Reverser", description: "Reverse characters or the order of words.", category: "text", icon: "↔", action: "text-reverse" },
    { id: "url-encoder", name: "URL Encoder / Decoder", description: "Encode or decode URL components.", category: "web", icon: "↗", action: "url-encode" },
    { id: "url-parser", name: "URL Parser", description: "Inspect the parts of a URL.", category: "web", icon: "⌕", action: "url-parse" },
    { id: "html-entities", name: "HTML Entity Converter", description: "Encode or decode special HTML characters.", category: "web", icon: "</>", action: "html-entities" },
    { id: "timestamp", name: "Timestamp Converter", description: "Convert Unix timestamps and readable dates.", category: "web", icon: "◷", action: "timestamp" },
    { id: "password-generate", name: "Password Generator", description: "Generate a random password with your options.", category: "generators", icon: "✳", action: "password-generate" },
    { id: "uuid-generate", name: "UUID Generator", description: "Generate a random version 4 UUID.", category: "generators", icon: "◇", action: "uuid-generate" },
    { id: "lorem-generate", name: "Lorem Ipsum Generator", description: "Generate placeholder text for layouts.", category: "generators", icon: "¶", action: "lorem-generate" },
    { id: "percentage-calculate", name: "Percentage Calculator", description: "Calculate a percentage of any number.", category: "generators", icon: "%", action: "percentage-calculate" },
    { id: "color-convert", name: "Color Converter", description: "Convert HEX colors into RGB and HSL.", category: "colors", icon: "◐", action: "color-convert" },
    { id: "color-random", name: "Random Color Generator", description: "Generate random HEX colors instantly.", category: "colors", icon: "#", action: "color-random" },
    { id: "gradient-generate", name: "CSS Gradient Generator", description: "Create a gradient and copy its CSS.", category: "colors", icon: "◒", action: "gradient-generate" },
    { id: "color-contrast", name: "Color Contrast Checker", description: "Check contrast between foreground and background.", category: "colors", icon: "◑", action: "color-contrast" }
];

const categoryNames = {
    all: "All Tools",
    code: "Code Tools",
    text: "Text Tools",
    web: "Web Tools",
    generators: "Generators",
    colors: "Color Tools"
};

const categoryDescriptions = {
    all: "Small tools that make a big difference.",
    code: "Utilities for working with code and data.",
    text: "Quick tools for everyday text tasks.",
    web: "Utilities for URLs, HTML and timestamps.",
    generators: "Generate useful values and content.",
    colors: "Convert, generate and compare colors."
};

document.addEventListener("DOMContentLoaded", init);

function init() {
    favorites = favorites.filter(id => tools.some(tool => tool.id === id));
    recentTools = recentTools.filter(id => tools.some(tool => tool.id === id));

    writeStorage(STORAGE_KEYS.favorites, favorites);
    writeStorage(STORAGE_KEYS.recent, recentTools);

    applySavedTheme();
    bindNavigation();
    bindSearch();
    bindThemeToggle();
    bindSidebar();
    bindKeyboardShortcuts();
    bindGlobalClicks();

    renderDashboard();
    updateStats();
    showPage("dashboard");
}

function bindNavigation() {
    $$("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
            closeSidebar();
        });
    });

    $$("[data-category]").forEach(button => {
        button.addEventListener("click", () => {
            const category = button.dataset.category;
            if (!category) return;

            activeCategory = category;
            $("#tool-search").value = "";

            showPage("dashboard");
            renderDashboard();
            closeSidebar();

            $("#tools-section").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    $("#back-to-dashboard").addEventListener("click", () => {
        showPage("dashboard");
    });
}

function showPage(page) {
    const validPages = ["dashboard", "tool", "favorites", "recent"];

    if (!validPages.includes(page)) page = "dashboard";

    currentPage = page;

    $$(".page").forEach(section => {
        section.classList.remove("active");
        section.classList.add("hidden");
    });

    const target = $(`#${page}-page`);

    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    const breadcrumbNames = {
        dashboard: "Dashboard",
        tool: currentToolId ? getTool(currentToolId)?.name || "Tool" : "Tool",
        favorites: "Favorites",
        recent: "Recently Used"
    };

    $("#breadcrumb-current").textContent = breadcrumbNames[page];

    $$(".nav-link").forEach(button => button.classList.remove("active"));

    const matchingNav = $(`.nav-link[data-page="${page}"]`);

    if (matchingNav) {
        matchingNav.classList.add("active");
    } else if (page === "dashboard" && activeCategory !== "all") {
        $(`.nav-link[data-category="${activeCategory}"]`)?.classList.add("active");
    } else if (page === "dashboard") {
        $('.nav-link[data-page="dashboard"]')?.classList.add("active");
    }

    if (page === "favorites") renderFavoritesPage();
    if (page === "recent") renderRecentPage();

    closeSidebar();
}

function bindSearch() {
    const search = $("#tool-search");

    search.addEventListener("input", () => {
        renderDashboard();
    });

    $$(".filter-chip").forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.filter || "all";
            search.value = "";
            renderDashboard();
        });
    });

    $("#clear-search").addEventListener("click", () => {
        search.value = "";
        activeCategory = "all";
        renderDashboard();
        search.focus();
    });
}

function getFilteredTools() {
    const query = $("#tool-search").value.trim().toLowerCase();

    return tools.filter(tool => {
        const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
        const searchable = [tool.name, tool.description, tool.category].join(" ").toLowerCase();
        return matchesCategory && searchable.includes(query);
    });
}

function renderDashboard() {
    const grid = $("#tool-grid");
    const filtered = getFilteredTools();
    const query = $("#tool-search").value.trim();

    $$(".filter-chip").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === activeCategory);
    });

    $("#tools-heading").textContent = query
        ? "Search results"
        : activeCategory === "all"
            ? "Explore tools"
            : categoryNames[activeCategory];

    $("#tools-description").textContent = query
        ? `Results matching "${query}".`
        : categoryDescriptions[activeCategory] || categoryDescriptions.all;

    $("#result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "tool" : "tools"}`;
    grid.innerHTML = filtered.map(createToolCard).join("");

    $("#no-results").classList.toggle("hidden", filtered.length !== 0);
    grid.classList.toggle("hidden", filtered.length === 0);

    renderQuickFavorites();
    updateStats();
}

function createToolCard(tool) {
    const isFavorite = favorites.includes(tool.id);

    return `
        <article class="tool-card" data-tool-card="${tool.id}">
            <button class="card-favorite ${isFavorite ? "is-favorite" : ""}"
                data-favorite="${tool.id}"
                aria-label="${isFavorite ? "Remove from" : "Add to"} favorites"
                title="${isFavorite ? "Remove favorite" : "Add favorite"}"
                type="button">${isFavorite ? "★" : "☆"}</button>
            <button class="tool-card-open" data-open-tool="${tool.id}" type="button">
                <div class="tool-card-icon">${escapeHTML(tool.icon)}</div>
                <span class="tool-category">${escapeHTML(categoryNames[tool.category])}</span>
                <h3>${escapeHTML(tool.name)}</h3>
                <p>${escapeHTML(tool.description)}</p>
                <span class="tool-card-arrow">Open tool <span>→</span></span>
            </button>
        </article>
    `;
}

function renderQuickFavorites() {
    const container = $("#favorite-tools");
    const favoriteList = favorites.map(getTool).filter(Boolean).slice(0, 4);

    if (favoriteList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">☆</span>
                <p>No favorites yet</p>
                <span>Star a tool to add it here.</span>
            </div>`;
        return;
    }

    container.innerHTML = favoriteList.map(createToolCard).join("");
}

function renderFavoritesPage() {
    const list = favorites.map(getTool).filter(Boolean);
    $("#favorites-page-grid").innerHTML = list.map(createToolCard).join("");
    $("#favorites-empty").classList.toggle("hidden", list.length > 0);
    $("#favorites-page-grid").classList.toggle("hidden", list.length === 0);
}

function renderRecentPage() {
    const list = recentTools.map(getTool).filter(Boolean);
    $("#recent-tools-grid").innerHTML = list.map(createToolCard).join("");
    $("#recent-empty").classList.toggle("hidden", list.length > 0);
    $("#recent-tools-grid").classList.toggle("hidden", list.length === 0);
}

function toggleFavorite(id) {
    if (!getTool(id)) return;

    favorites = favorites.includes(id)
        ? favorites.filter(item => item !== id)
        : [id, ...favorites];

    writeStorage(STORAGE_KEYS.favorites, favorites);
    renderDashboard();

    if (currentPage === "favorites") renderFavoritesPage();
    if (currentPage === "recent") renderRecentPage();
    if (currentPage === "tool") updateWorkspaceFavorite();

    updateStats();
}

function addToRecent(id) {
    recentTools = [id, ...recentTools.filter(item => item !== id)].slice(0, 12);
    writeStorage(STORAGE_KEYS.recent, recentTools);
    updateStats();
}

function updateStats() {
    $("#total-tools").textContent = tools.length;
    $("#favorite-count").textContent = favorites.length;
    $("#recent-count").textContent = recentTools.length;
}

function updateWorkspaceFavorite() {
    const button = $("#workspace-favorite");
    const isFavorite = favorites.includes(currentToolId);

    button.textContent = isFavorite ? "★" : "☆";
    button.title = isFavorite ? "Remove from favorites" : "Add to favorites";
    button.setAttribute("aria-label", button.title);
    button.classList.toggle("is-favorite", isFavorite);
}

function openTool(id) {
    const tool = getTool(id);
    if (!tool) return;

    currentToolId = id;
    addToRecent(id);

    $("#workspace-icon").textContent = tool.icon;
    $("#workspace-title").textContent = tool.name;
    $("#workspace-description").textContent = tool.description;
    $("#workspace-category").textContent = categoryNames[tool.category].toUpperCase();
    $("#tool-workspace").innerHTML = createToolInterface(tool);

    updateWorkspaceFavorite();
    showPage("tool");
    $("#breadcrumb-current").textContent = tool.name;

    $("#tool-workspace input, #tool-workspace textarea")?.focus({ preventScroll: true });
}

function createToolInterface(tool) {
    const header = `
        <div class="tool-panel">
            <div class="tool-panel-heading">
                <div>
                    <h2>${escapeHTML(tool.name)}</h2>
                    <p>${escapeHTML(tool.description)}</p>
                </div>
            </div>`;

    const footer = `
            <div class="tool-message" id="tool-message" role="status" aria-live="polite"></div>
        </div>`;

    const interfaces = {
        "json-format": `${textArea("tool-input", "Paste JSON here...", '{"name":"CtrlShift","tools":[1,2,3]}')}
            <div class="button-row">${actionButton("Format JSON", "json-format")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "json-minify": `${textArea("tool-input", "Paste JSON here...", '{\n  "name": "CtrlShift",\n  "active": true\n}')}
            <div class="button-row">${actionButton("Minify JSON", "json-minify")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "json-validate": `${textArea("tool-input", "Paste JSON to validate...", '{"valid": true}')}
            <div class="button-row">${actionButton("Validate JSON", "json-validate")}</div>${outputArea()}`,
        "regex-tester": `${textInput("regex-pattern", "Regular expression", "\\\\bcat\\\\b")}${textInput("regex-flags", "Flags (optional)", "gi")}
            ${textArea("tool-input", "Text to test against...", "A cat and another cat.")}<div class="button-row">${actionButton("Test expression", "regex-test")}</div>${outputArea()}`,
        "text-case": `${textArea("tool-input", "Enter your text...", "Hello World from CtrlShift")}
            <div class="button-row">${actionButton("UPPERCASE", "case-upper")}${actionButton("lowercase", "case-lower", "secondary")}${actionButton("Title Case", "case-title", "secondary")}${actionButton("Sentence case", "case-sentence", "secondary")}</div>${outputArea()}`,
        "word-counter": `${textArea("tool-input", "Type or paste your text...", "Count the words and characters in this sentence.")}<div class="button-row">${actionButton("Count text", "word-count")}</div>${outputArea()}`,
        "duplicate-lines": `${textArea("tool-input", "Paste lines here...", "apple\nbanana\napple\norange\nbanana")}
            <label class="option-label"><input type="checkbox" id="ignore-case" checked> Ignore case when comparing lines</label>
            <div class="button-row">${actionButton("Remove duplicates", "duplicate-lines")}</div>${outputArea()}`,
        "text-reverse": `${textArea("tool-input", "Enter your text...", "Hello CtrlShift")}
            <div class="button-row">${actionButton("Reverse characters", "reverse-characters")}${actionButton("Reverse words", "reverse-words", "secondary")}</div>${outputArea()}`,
        "url-encoder": `${textArea("tool-input", "Enter text or an encoded URL component...", "hello world & welcome")}
            <div class="button-row">${actionButton("Encode", "url-encode")}${actionButton("Decode", "url-decode", "secondary")}</div>${outputArea()}`,
        "url-parser": `${textInput("url-input", "Enter a complete URL", "https://example.com:8080/path?q=hello#section")}
            <div class="button-row">${actionButton("Parse URL", "url-parse")}</div>${outputArea()}`,
        "html-entities": `${textArea("tool-input", "Enter HTML or text...", '<h1>Tom & Jerry</h1>')}
            <div class="button-row">${actionButton("Encode entities", "html-encode")}${actionButton("Decode entities", "html-decode", "secondary")}</div>${outputArea()}`,
        "timestamp": `${textInput("timestamp-input", "Unix timestamp in seconds or milliseconds", String(Math.floor(Date.now() / 1000)))}
            <div class="button-row">${actionButton("Convert timestamp", "timestamp-to-date")}</div>${outputArea()}
            <div class="tool-divider"></div><label class="field-label" for="date-input">Or convert a date to Unix time</label>
            <input class="tool-input" id="date-input" type="datetime-local"><div class="button-row">${actionButton("Convert date", "date-to-timestamp")}</div>
            <div class="output-box" id="date-output" aria-live="polite"></div>`,
        "password-generate": `<label class="field-label" for="password-length">Password length</label><input class="tool-input" id="password-length" type="number" min="4" max="128" value="20">
            <div class="options-grid">${checkbox("password-lower", "Lowercase letters", true)}${checkbox("password-upper", "Uppercase letters", true)}${checkbox("password-numbers", "Numbers", true)}${checkbox("password-symbols", "Symbols", true)}</div>
            <div class="button-row">${actionButton("Generate password", "password-generate")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "uuid-generate": `<label class="field-label" for="uuid-count">Number of UUIDs (1–50)</label><input class="tool-input" id="uuid-count" type="number" min="1" max="50" value="1">
            <div class="button-row">${actionButton("Generate UUID", "uuid-generate")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "lorem-generate": `<label class="field-label" for="lorem-count">Number of paragraphs (1–10)</label><input class="tool-input" id="lorem-count" type="number" min="1" max="10" value="3">
            <div class="button-row">${actionButton("Generate text", "lorem-generate")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "percentage-calculate": `${textInput("percentage-rate", "Percentage (%)", "15", "number")}${textInput("percentage-number", "Number", "200", "number")}
            <div class="button-row">${actionButton("Calculate", "percentage-calculate")}</div>${outputArea()}`,
        "color-convert": `${textInput("color-input", "HEX color", "#8b5cf6")}
            <div class="button-row">${actionButton("Convert color", "color-convert")}${actionButton("Copy output", "copy-output", "secondary")}</div><div class="color-preview" id="color-preview"></div>${outputArea()}`,
        "color-random": `<label class="field-label" for="random-color-count">Number of colors (1–20)</label><input class="tool-input" id="random-color-count" type="number" min="1" max="20" value="5">
            <div class="button-row">${actionButton("Generate colors", "color-random")}${actionButton("Copy output", "copy-output", "secondary")}</div><div class="color-swatches" id="color-swatches"></div>${outputArea()}`,
        "gradient-generate": `${textInput("gradient-color-one", "First color", "#8b5cf6")}${textInput("gradient-color-two", "Second color", "#111111")}
            <label class="field-label" for="gradient-angle">Gradient angle</label><input class="tool-input" id="gradient-angle" type="number" min="0" max="360" value="135">
            <div class="color-preview gradient-preview" id="gradient-preview"></div><div class="button-row">${actionButton("Generate gradient", "gradient-generate")}${actionButton("Copy output", "copy-output", "secondary")}</div>${outputArea()}`,
        "color-contrast": `${textInput("contrast-foreground", "Foreground text color", "#ffffff")}${textInput("contrast-background", "Background color", "#111111")}
            <div class="button-row">${actionButton("Check contrast", "color-contrast")}</div><div class="contrast-preview" id="contrast-preview">Sample text preview</div>${outputArea()}`
    };

    return header + (interfaces[tool.id] || "<p>Tool interface unavailable.</p>") + footer;
}

function textArea(id, placeholder, value = "") {
    return `<label class="field-label" for="${id}">Input</label><textarea class="tool-input tool-textarea" id="${id}" placeholder="${escapeHTML(placeholder)}" spellcheck="false">${escapeHTML(value)}</textarea>`;
}

function textInput(id, label, value = "", type = "text") {
    return `<label class="field-label" for="${id}">${escapeHTML(label)}</label><input class="tool-input" id="${id}" type="${type}" value="${escapeHTML(value)}" autocomplete="off" spellcheck="false">`;
}

function checkbox(id, label, checked = false) {
    return `<label class="option-label"><input id="${id}" type="checkbox" ${checked ? "checked" : ""}> ${escapeHTML(label)}</label>`;
}

function actionButton(label, action, style = "primary") {
    return `<button class="${style === "secondary" ? "secondary-button" : "primary-button"}" type="button" data-action="${action}">${escapeHTML(label)}</button>`;
}

function outputArea() {
    return `<label class="field-label" for="tool-output">Output</label><pre class="output-box" id="tool-output" tabindex="0" aria-live="polite"></pre>`;
}

function bindGlobalClicks() {
    document.addEventListener("click", event => {
        const openButton = event.target.closest("[data-open-tool]");
        if (openButton) {
            openTool(openButton.dataset.openTool);
            return;
        }

        const favoriteButton = event.target.closest("[data-favorite]");
        if (favoriteButton) {
            event.stopPropagation();
            toggleFavorite(favoriteButton.dataset.favorite);
            return;
        }

        const colorButton = event.target.closest("[data-copy-color]");
        if (colorButton) {
            copyText(colorButton.dataset.copyColor)
                .then(() => setMessage("Color copied to clipboard."))
                .catch(error => setMessage(error.message, true));
            return;
        }

        const actionButtonElement = event.target.closest("[data-action]");
        if (actionButtonElement) runAction(actionButtonElement.dataset.action);
    });

    $("#workspace-favorite").addEventListener("click", () => {
        if (currentToolId) toggleFavorite(currentToolId);
    });
}

function getInput(id) {
    return $(`#${id}`, $("#tool-workspace"))?.value ?? "";
}

function getChecked(id) {
    return $(`#${id}`, $("#tool-workspace"))?.checked ?? false;
}

function getOutput() {
    return $("#tool-output", $("#tool-workspace"));
}

function setOutput(value) {
    const output = getOutput();
    if (output) output.textContent = String(value);
}

function setMessage(message, isError = false) {
    const element = $("#tool-message", $("#tool-workspace"));
    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

function requireInput(id, label = "Input") {
    const value = getInput(id);
    if (!value.trim()) throw new Error(`${label} cannot be empty.`);
    return value;
}

async function runAction(action) {
    try {
        setMessage("");

        if (action === "copy-output") {
            const output = getOutput();
            if (!output || !output.textContent.trim()) throw new Error("There is no output to copy yet.");

            await copyText(output.textContent);
            setMessage("Output copied to clipboard.");
            return;
        }

        switch (action) {
            case "json-format": {
                const parsed = JSON.parse(requireInput("tool-input", "JSON"));
                setOutput(JSON.stringify(parsed, null, 2));
                break;
            }
            case "json-minify": {
                const parsed = JSON.parse(requireInput("tool-input", "JSON"));
                setOutput(JSON.stringify(parsed));
                break;
            }
            case "json-validate":
                JSON.parse(requireInput("tool-input", "JSON"));
                setOutput("Valid JSON ✓");
                setMessage("Your JSON is valid.");
                break;
            case "regex-test": {
                const pattern = requireInput("regex-pattern", "Regular expression");
                const flags = getInput("regex-flags").trim();
                const input = requireInput("tool-input", "Test text");
                const regex = new RegExp(pattern, flags);
                const globalRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
                const matches = [...input.matchAll(globalRegex)];

                setOutput(matches.length
                    ? `Found ${matches.length} match(es):\n\n` + matches.map((match, index) => `${index + 1}. ${JSON.stringify(match[0])} — index ${match.index}`).join("\n")
                    : "No matches found.");
                break;
            }
            case "case-upper":
                setOutput(requireInput("tool-input").toUpperCase());
                break;
            case "case-lower":
                setOutput(requireInput("tool-input").toLowerCase());
                break;
            case "case-title":
                setOutput(requireInput("tool-input").toLowerCase().replace(/\b[\p{L}\p{N}]/gu, char => char.toUpperCase()));
                break;
            case "case-sentence": {
                const input = requireInput("tool-input").toLowerCase();
                setOutput(input.replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, match => match.toUpperCase()));
                break;
            }
            case "word-count": {
                const input = requireInput("tool-input");
                const words = input.trim().match(/\S+/g) || [];
                const characters = [...input].length;
                const noSpaces = [...input.replace(/\s/g, "")].length;
                const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
                const sentences = input.trim() ? (input.trim().match(/[^.!?]+[.!?]*/g) || []).filter(sentence => sentence.trim()).length : 0;

                setOutput(`Words: ${words.length}\nCharacters: ${characters}\nCharacters (without whitespace): ${noSpaces}\nLines: ${lines}\nSentences: ${sentences}`);
                break;
            }
            case "duplicate-lines": {
                const input = requireInput("tool-input");
                const seen = new Set();
                const ignoreCase = getChecked("ignore-case");
                const result = input.split(/\r\n|\r|\n/).filter(line => {
                    const key = ignoreCase ? line.toLowerCase() : line;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                setOutput(result.join("\n"));
                setMessage(`${input.split(/\r\n|\r|\n/).length - result.length} duplicate line(s) removed.`);
                break;
            }
            case "reverse-characters":
                setOutput([...requireInput("tool-input")].reverse().join(""));
                break;
            case "reverse-words":
                setOutput(requireInput("tool-input").trim().split(/\s+/).reverse().join(" "));
                break;
            case "url-encode":
                setOutput(encodeURIComponent(requireInput("tool-input")));
                break;
            case "url-decode":
                setOutput(decodeURIComponent(requireInput("tool-input")));
                break;
            case "url-parse": {
                const url = new URL(requireInput("url-input", "URL"));
                setOutput(`Protocol: ${url.protocol}\nHostname: ${url.hostname}\nPort: ${url.port || "(default)"}\nPathname: ${url.pathname}\nSearch: ${url.search || "(none)"}\nHash: ${url.hash || "(none)"}\nOrigin: ${url.origin}`);
                break;
            }
            case "html-encode": {
                const input = requireInput("tool-input");
                const element = document.createElement("div");
                element.textContent = input;
                setOutput(element.innerHTML);
                break;
            }
            case "html-decode": {
                const input = requireInput("tool-input");
                const element = document.createElement("textarea");
                element.innerHTML = input;
                setOutput(element.value);
                break;
            }
            case "timestamp-to-date": {
                const timestamp = Number(requireInput("timestamp-input", "Timestamp").trim());
                if (!Number.isFinite(timestamp)) throw new Error("Enter a valid Unix timestamp.");

                const milliseconds = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
                const date = new Date(milliseconds);
                if (Number.isNaN(date.getTime())) throw new Error("That timestamp is outside the supported date range.");

                setOutput(`UTC: ${date.toISOString()}\nLocal time: ${date.toLocaleString()}\nUnix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}`);
                break;
            }
            case "date-to-timestamp": {
                const input = getInput("date-input");
                if (!input) throw new Error("Choose a date and time first.");

                const date = new Date(input);
                if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date.");

                $("#date-output").textContent = `Unix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}\nUTC: ${date.toISOString()}`;
                break;
            }
            case "password-generate": {
                const length = readInteger("password-length", 20, 4, 128);
                let characters = "";

                if (getChecked("password-lower")) characters += "abcdefghijklmnopqrstuvwxyz";
                if (getChecked("password-upper")) characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                if (getChecked("password-numbers")) characters += "0123456789";
                if (getChecked("password-symbols")) characters += "!@#$%^&*()-_=+[]{};:,.?";

                if (!characters) throw new Error("Select at least one character type.");

                let password = "";
                const limit = Math.floor(0x100000000 / characters.length) * characters.length;

                while (password.length < length) {
                    const values = new Uint32Array(length - password.length + 8);
                    crypto.getRandomValues(values);

                    for (const value of values) {
                        if (value >= limit) continue;
                        password += characters[value % characters.length];
                        if (password.length === length) break;
                    }
                }

                setOutput(password);
                break;
            }
            case "uuid-generate": {
                const count = readInteger("uuid-count", 1, 1, 50);
                const values = [];

                for (let i = 0; i < count; i++) {
                    values.push(crypto.randomUUID ? crypto.randomUUID() : createUUID());
                }

                setOutput(values.join("\n"));
                break;
            }
            case "lorem-generate": {
                const count = readInteger("lorem-count", 3, 1, 10);
                const sample = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.";
                setOutput(Array(count).fill(sample).join("\n\n"));
                break;
            }
            case "percentage-calculate": {
                const rateText = getInput("percentage-rate").trim();
                const numberText = getInput("percentage-number").trim();
                const rate = Number(rateText);
                const number = Number(numberText);

                if (rateText === "" || numberText === "" || !Number.isFinite(rate) || !Number.isFinite(number)) {
                    throw new Error("Enter valid numbers.");
                }

                setOutput(`${rate}% of ${number} = ${(rate / 100 * number).toLocaleString()}`);
                break;
            }
            case "color-convert": {
                const hex = normalizeHex(requireInput("color-input", "HEX color"));
                const rgb = hexToRgb(hex);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

                $("#color-preview").style.backgroundColor = hex;
                setOutput(`HEX: ${hex}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
                break;
            }
            case "color-random": {
                const count = readInteger("random-color-count", 5, 1, 20);
                const colors = [];

                for (let i = 0; i < count; i++) {
                    colors.push("#" + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0"));
                }

                $("#color-swatches").innerHTML = colors.map(color => `<button type="button" class="color-swatch" data-copy-color="${color}" style="background-color:${color}" title="Copy ${color}"><span>${color}</span></button>`).join("");
                setOutput(colors.join("\n"));
                break;
            }
            case "gradient-generate": {
                const first = normalizeHex(requireInput("gradient-color-one", "First color"));
                const second = normalizeHex(requireInput("gradient-color-two", "Second color"));
                const angle = readInteger("gradient-angle", 135, 0, 360);
                const css = `linear-gradient(${angle}deg, ${first}, ${second})`;

                $("#gradient-preview").style.background = css;
                setOutput(`background: ${css};`);
                break;
            }
            case "color-contrast": {
                const foreground = normalizeHex(requireInput("contrast-foreground", "Foreground color"));
                const background = normalizeHex(requireInput("contrast-background", "Background color"));
                const ratio = contrastRatio(hexToRgb(foreground), hexToRgb(background));
                const preview = $("#contrast-preview");

                preview.style.color = foreground;
                preview.style.backgroundColor = background;

                setOutput(`Contrast ratio: ${ratio.toFixed(2)}:1\n\nWCAG AA normal text: ${ratio >= 4.5 ? "PASS" : "FAIL"} (4.5:1 required)\nWCAG AA large text: ${ratio >= 3 ? "PASS" : "FAIL"} (3:1 required)\nWCAG AAA normal text: ${ratio >= 7 ? "PASS" : "FAIL"} (7:1 required)`);
                break;
            }
            default:
                throw new Error("Unknown tool action.");
        }

        if (action !== "json-validate") setMessage("Done.");
    } catch (error) {
        setOutput("");
        setMessage(error instanceof Error ? error.message : "Something went wrong.", true);
    }
}

function readInteger(id, fallback, min, max) {
    const text = getInput(id).trim();
    const value = text === "" ? fallback : Number(text);

    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`Enter a whole number from ${min} to ${max}.`);
    }

    return value;
}

function normalizeHex(value) {
    let hex = value.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;

    if (/^#[0-9a-f]{3}$/i.test(hex)) {
        hex = "#" + [...hex.slice(1)].map(char => char + char).join("");
    }

    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
        throw new Error("Enter a valid HEX color, such as #8b5cf6.");
    }

    return hex.toLowerCase();
}

function hexToRgb(hex) {
    const clean = normalizeHex(hex).slice(1);

    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16)
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
                h = 60 * (((g - b) / delta) % 6);
                break;
            case g:
                h = 60 * ((b - r) / delta + 2);
                break;
            default:
                h = 60 * ((r - g) / delta + 4);
        }
    }

    if (h < 0) h += 360;

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance(rgb) {
    const channels = [rgb.r, rgb.g, rgb.b].map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
    const firstLuminance = luminance(first);
    const secondLuminance = luminance(second);
    const lighter = Math.max(firstLuminance, secondLuminance);
    const darker = Math.min(firstLuminance, secondLuminance);

    return (lighter + 0.05) / (darker + 0.05);
}

function createUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
        const random = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
        const value = char === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand("copy");
        temporary.remove();

        if (!copied) {
            throw new Error("Clipboard access failed. Select and copy the output manually.");
        }
    }
}

function applySavedTheme() {
    let theme = "dark";

    try {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        if (savedTheme === "dark" || savedTheme === "light") theme = savedTheme;
    } catch {
        theme = "dark";
    }

    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    updateThemeButton(theme);
}

function bindThemeToggle() {
    $("#theme-toggle").addEventListener("click", () => {
        const current = document.documentElement.dataset.theme || "dark";
        const next = current === "dark" ? "light" : "dark";

        document.documentElement.dataset.theme = next;
        document.body.dataset.theme = next;

        try {
            localStorage.setItem(STORAGE_KEYS.theme, next);
        } catch {
            // Theme still changes for this page view.
        }

        updateThemeButton(next);
    });
}

function updateThemeButton(theme) {
    const button = $("#theme-toggle");
    button.textContent = theme === "dark" ? "☼" : "◐";
    button.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

function bindSidebar() {
    $("#menu-toggle").addEventListener("click", () => {
        const sidebar = $("#sidebar");
        const isOpen = sidebar.classList.toggle("open");
        $("#menu-toggle").setAttribute("aria-expanded", String(isOpen));
    });
}

function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
}

function bindKeyboardShortcuts() {
    document.addEventListener("keydown", event => {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const typing = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;

        if (event.key === "/" && !typing) {
            event.preventDefault();
            $("#tool-search").focus();
        }

        if (event.key === "Escape") {
            closeSidebar();
            if (currentPage === "tool") showPage("dashboard");
        }
    });
}

function getTool(id) {
    return tools.find(tool => tool.id === id);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
