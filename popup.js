const DARK_MODE_KEY = "protonDocsDarkModeEnabled";
const enabled = document.querySelector("#enabled");

chrome.storage.local.get({ [DARK_MODE_KEY]: true }, (settings) => {
  enabled.checked = settings[DARK_MODE_KEY];
});

enabled.addEventListener("change", () => {
  chrome.storage.local.set({ [DARK_MODE_KEY]: enabled.checked });
});
