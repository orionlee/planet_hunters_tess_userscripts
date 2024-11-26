// ==UserScript==
// @name        eta-earth TESS Light Curve Explorer UI tweaks
// @namespace   astro.tess
// @match       https://eta-earth.org/tess_fits_play.html
// @noframes
// @grant       GM_addStyle
// @version     1.1
// @author      -
// @description
// @icon        https://eta-earth.org/favicon.ico
// ==/UserScript==


function roundNum(text, numDigits=2) {
  if (!text) {
    return '--';
  }
  return parseFloat(text).toFixed(numDigits);
}


function showStellarParams() {
  const _t = document.getElementById('headerDialogContent').textContent;
  if (!_t) {
    setTimeout(showStellarParams, 2000);
    return;
  }

  const rad = roundNum(_t.match(/RADIUS\s+=\s+([^/]*)/)[1])
  const teff = roundNum(_t.match(/TEFF\s+=\s+([^/]*)/)[1], 0)
  const tmag = roundNum(_t.match(/TESSMAG\s+=\s+([^/]*)/)[1])

  document.getElementById('plotOutput').insertAdjacentHTML('beforebegin',`
<div id="stellarParamsCtr">
  ${rad} R<sub>sun</sub> ; ${teff} K ; ${tmag} Tmag
</div>
`);
}
setTimeout(showStellarParams, 2000);


//
// mousewheel click to toggle zoom/pan, copied from tess_fli_tweak.user.js
//

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

