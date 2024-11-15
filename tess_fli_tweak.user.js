// ==UserScript==
// @name        TESS Fast Lightcurve Inspector Tweak
// @namespace   astro.tess
// @match       https://fast-lightcurve-inspector.osc-fr1.scalingo.io/*
// @noframes
// @grant       GM_addStyle
// @version     1.1
// @author      -
// @description
// @icon        https://fast-lightcurve-inspector.osc-fr1.scalingo.io/favicon.ico
// ==/UserScript==

function addKeyboardShortcut() {
  const elTic = document.querySelector('input[name="tic_number"]');
  if (elTic) {
    elTic.accessKey = "/"
    elTic.placeholder = "TIC number. Shortcut: Alt-/"
  }
}
addKeyboardShortcut();


function onMouseWheelToggleLCZoomPan(evt) {
  function getTool(name) {
    // it selects the tool at the top, which is the tool for the LC
    return document.querySelector(`.modebar-group > a[data-title="${name}"]`)
  }

  function isActive(toolEl) {
    return toolEl?.classList?.contains("active");
  }

  //
  // main logic
  //
  // we intercept middle click (button === 1) only
  if (evt.button !== 1) {
    return;
  }

  if (!['RECT', 'G'].includes(evt.target.tagName.toUpperCase())) {
    // tagName for svg elements in lower case in chrome,
    // use upper case to avoid any potential browser incompatibility

    // empirically a mouse down is caught by <rect> elements,
    // but I also include the parent <g> to be safe.
    return;
  }

  // case mouse wheel on the svg plot (for now we don't track if it's the LC's svg plot)
  evt.preventDefault();

  const [zoomEl, panEl] = [getTool("Zoom"), getTool("Pan")];
  if (!isActive(zoomEl)) {
    zoomEl?.click();
    // console.debug("In Zoom mode");
  } else {
    panEl?.click();
    // console.debug("In Pan mode");
  }
}


function useMouseWheelToToggleLCZoomPan() {
  document.addEventListener('mousedown', onMouseWheelToggleLCZoomPan);
  GM_addStyle(`
.js-plotly-plot .plotly .modebar-btn.active { /* make active tool standout more */
    background-color: rgba(255, 255, 0, 0.4);
}
`);
}
useMouseWheelToToggleLCZoomPan();

