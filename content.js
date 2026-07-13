const DARK_MODE_KEY = "protonDocsDarkModeEnabled";
const ROOT_CLASS = "proton-docs-local-dark-mode";
const shadowStyles = new Map();
let shadowObserver;
let shadowScanQueued = false;

function rememberOriginalStyles(element) {
  if (shadowStyles.has(element)) return;

  shadowStyles.set(element, {
    boxShadow: element.style.getPropertyValue("box-shadow"),
    boxShadowPriority: element.style.getPropertyPriority("box-shadow"),
    beforeShadow: element.style.getPropertyValue("--proton-local-before-shadow"),
    beforeShadowPriority: element.style.getPropertyPriority("--proton-local-before-shadow"),
    afterShadow: element.style.getPropertyValue("--proton-local-after-shadow"),
    afterShadowPriority: element.style.getPropertyPriority("--proton-local-after-shadow"),
    hadBeforeClass: element.classList.contains("proton-local-before-shadow"),
    hadAfterClass: element.classList.contains("proton-local-after-shadow")
  });
}

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

  rememberOriginalStyles(element);
  element.style.setProperty("box-shadow", correctedShadow, "important");
}

function applyPseudoShadowFix(element, pseudoElement, property, className) {
  const shadow = getComputedStyle(element, pseudoElement).boxShadow;
  if (!shadow || shadow === "none") return;

  const correctedShadow = invertedShadow(shadow);
  if (shadow === correctedShadow) return;

  rememberOriginalStyles(element);
  element.style.setProperty(property, correctedShadow, "important");
  element.classList.add(className);
}

function scanShadows(root = document.documentElement) {
  if (!document.documentElement.classList.contains(ROOT_CLASS) || !root) return;

  applyShadowFix(root);
  root.querySelectorAll?.("*").forEach(applyShadowFix);
  const descendants = root.querySelectorAll?.("*") ?? [];
  [root, ...descendants].forEach((element) => {
    applyPseudoShadowFix(element, "::before", "--proton-local-before-shadow", "proton-local-before-shadow");
    applyPseudoShadowFix(element, "::after", "--proton-local-after-shadow", "proton-local-after-shadow");
  });
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
    restoreProperty(element, "box-shadow", originalStyle.boxShadow, originalStyle.boxShadowPriority);
    restoreProperty(element, "--proton-local-before-shadow", originalStyle.beforeShadow, originalStyle.beforeShadowPriority);
    restoreProperty(element, "--proton-local-after-shadow", originalStyle.afterShadow, originalStyle.afterShadowPriority);
    element.classList.toggle("proton-local-before-shadow", originalStyle.hadBeforeClass);
    element.classList.toggle("proton-local-after-shadow", originalStyle.hadAfterClass);
  }
  shadowStyles.clear();
}

function restoreProperty(element, property, value, priority) {
  if (value) {
    element.style.setProperty(property, value, priority);
  } else {
    element.style.removeProperty(property);
  }
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
