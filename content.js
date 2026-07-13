const DARK_MODE_KEY = "protonDocsDarkModeEnabled";
const ROOT_CLASS = "proton-docs-local-dark-mode";
const shadowStyles = new Map();
let shadowObserver;
let shadowScanQueued = false;

function invertedShadow(shadow) {
  // Computed shadows are serialised as rgb()/rgba(). We retain the geometry
  // and alpha but use white as the source colour, which becomes dark after the
  // page-level inversion filter.
  return shadow.replace(/rgba?\(([^)]+)\)/g, (_match, values) => {
    if (/^\s*255(?:[ ,]+)255(?:[ ,]+)255(?:\s*[,/].*)?\s*$/.test(values)) {
      return _match;
    }

    const parts = values.split(",").map((value) => value.trim());
    const alpha = parts.length === 4 ? ` / ${parts[3]}` : "";
    return `rgb(255 255 255${alpha})`;
  });
}

function applyShadowFix(element) {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return;

  const shadow = getComputedStyle(element).boxShadow;
  if (!shadow || shadow === "none") return;

  const correctedShadow = invertedShadow(shadow);
  if (shadow === correctedShadow) return;

  if (!shadowStyles.has(element)) {
    shadowStyles.set(element, {
      value: element.style.getPropertyValue("box-shadow"),
      priority: element.style.getPropertyPriority("box-shadow")
    });
  }

  element.style.setProperty("box-shadow", correctedShadow, "important");
}

function scanShadows(root = document.documentElement) {
  if (!document.documentElement.classList.contains(ROOT_CLASS) || !root) return;

  applyShadowFix(root);
  root.querySelectorAll?.("*").forEach(applyShadowFix);
}

function queueShadowScan() {
  if (shadowScanQueued) return;
  shadowScanQueued = true;
  requestAnimationFrame(() => {
    shadowScanQueued = false;
    scanShadows();
  });
}

function restoreShadows() {
  for (const [element, originalStyle] of shadowStyles) {
    if (originalStyle.value) {
      element.style.setProperty("box-shadow", originalStyle.value, originalStyle.priority);
    } else {
      element.style.removeProperty("box-shadow");
    }
  }
  shadowStyles.clear();
}

function startShadowFix() {
  scanShadows();
  shadowObserver ??= new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(queueShadowScan);
      } else {
        queueShadowScan();
      }
    }
  });
  shadowObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "style"]
  });
}

function setDarkMode(enabled) {
  document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  if (enabled) {
    startShadowFix();
  } else {
    restoreShadows();
  }
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
