// ==UserScript==
// @name        TESS Fast Lightcurve Inspector Tweak
// @namespace   astro.tess
// @match       https://fast-lightcurve-inspector.osc-fr1.scalingo.io/*
// @noframes
// @grant       GM_addStyle
// @version     1.0
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
