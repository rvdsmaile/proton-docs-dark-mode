const DARK_MODE_KEY = "protonDocsDarkModeEnabled";
const ROOT_CLASS = "proton-docs-local-dark-mode";

function setDarkMode(enabled) {
  document.documentElement.classList.toggle(ROOT_CLASS, enabled);
}

chrome.storage.local.get({ [DARK_MODE_KEY]: true }, (settings) => {
  setDarkMode(settings[DARK_MODE_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[DARK_MODE_KEY]) {
    setDarkMode(changes[DARK_MODE_KEY].newValue);
  }
});

// A quick escape hatch while editing: Cmd/Ctrl + Shift + D.
document.addEventListener("keydown", (event) => {
  if (!event.shiftKey || !event.metaKey && !event.ctrlKey || event.key.toLowerCase() !== "d") {
    return;
  }

  event.preventDefault();
  chrome.storage.local.get({ [DARK_MODE_KEY]: true }, (settings) => {
    chrome.storage.local.set({ [DARK_MODE_KEY]: !settings[DARK_MODE_KEY] });
  });
}, true);
