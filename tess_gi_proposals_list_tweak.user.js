// ==UserScript==
// @name        TESS GI Proposal List Page Tweak
// @namespace   astro.tess
// @match       https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html
// @noframes
// @version     1.1
// @author      -
// @description
// @icon        https://heasarc.gsfc.nasa.gov/docs/tess/images/logos/favicon.png
// ==/UserScript==

function autoFillSearchTerm() {
  function doFillValue(value, retryDelayMs) {
    const inputEl = document.querySelector('input[type="search"]');
    if (inputEl) {
      inputEl.value = value;
      inputEl.focus();
      // change the focus to trigger the search
      document.querySelector('a').focus();
      inputEl.focus();
    } else {
      setTimeout(() => doFillValue(value, retryDelayMs), retryDelayMs);
    }
  }

  const [, term] = location.hash.match(/[#]search=([^&]+)/) || [null, null];
  if (!term) {
    return;
  }

  doFillValue(term, 2000); // retry every 2s till the input is rendered.
}
autoFillSearchTerm();
