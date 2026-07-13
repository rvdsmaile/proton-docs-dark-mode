# Proton Docs Dark Mode

A tiny, local-only Chromium extension that gives [Proton Docs](https://docs.proton.me)
a comfortable dark appearance while Proton's editor is still light-only.

It is built for [Helium](https://helium.computer/), but should also work in other
Chromium browsers that allow unpacked extensions.

## What it does

- Applies a reversible dark visual treatment only on `docs.proton.me`.
- Leaves images, video, and canvases in their intended colours.
- Keeps inline `currentColor` SVG interface icons light and preserves dark
  elevation shadows across Proton's UI.
- Lets you toggle the effect from the toolbar popup or with
  <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>.

## Privacy

This extension is deliberately boring:

- no network requests
- no analytics
- no background process
- no reading, changing, or sending of document contents
- one local browser setting: whether the effect is enabled

Its only site permission is `https://docs.proton.me/*`.

## Install in Helium

1. Open Helium's extension management page: `helium://extensions` (or
   `chrome://extensions` if Helium redirects it there).
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Choose this repository's folder.
5. Open [Proton Docs](https://docs.proton.me). The dark mode is enabled by
   default.

Click the extension icon to turn it on or off. Changes apply to open Docs tabs
straight away.

## How it works

Proton Docs is a moving target internally, so this extension avoids brittle
editor-specific selectors. It applies a display-only filter to the page,
reverses that treatment for raster media, and corrects each rendered shadow's
colour while retaining its original size and opacity. This keeps the extension
small, resilient, and content-safe.

## Caveat

This is a visual inversion, not a theme implemented by Proton. A rare embedded
widget or unusual image effect may look imperfect; use the toggle to disable it
for that view.

## Development

After modifying a file, open the extension page and click **Reload**, then
refresh Proton Docs. No build step or dependencies are required.
