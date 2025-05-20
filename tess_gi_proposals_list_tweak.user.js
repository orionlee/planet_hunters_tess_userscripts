// ==UserScript==
// @name        TESS GI Proposal List Page Tweak
// @namespace   astro.tess
// @match       https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html
// @match       https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs-em1.html
// @match       https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs-primary.html
// @noframes
// @version     1.0
// @author      -
// @description
// @icon        https://heasarc.gsfc.nasa.gov/favicon.ico
// ==/UserScript==

function autoFillSearchTerm() {
  function doFillValue(value, retryDelayMs) {
    const inputEl = document.querySelector('input[type="search"]')
    if (inputEl) {
      inputEl.value = value;
      inputEl.focus();
    } else {
      setTimeout(() => doFillValue(value, retryDelayMs), retryDelayMs);
    }
  };

  if (location.pathname != '/docs/tess/approved-programs.html') {
    return;
  }

  const [, term] = location.search.match(/[?&]term=([^&]+)/) || [null, null];
  if (!term) {
    return;
  }

  doFillValue(term, 2000);  // retry every 2s till the input is rendered.
}
autoFillSearchTerm();


function addLinkToCurrentGIPage() {
  if (
    location.pathname == '/docs/tess/approved-programs-em1.html' ||
    location.pathname == '/docs/tess/approved-programs-primary.html'
  ) {
    // The legacy pages no longer exist. Show link to the current URL.
    document.body.insertAdjacentHTML('beforeend', `
<div id="new_url_ctr" style="position: fixed; top: 30vh; left:2vw; padding: 12px; background: rgba(255, 255, 0, 0.7);">
  <a href="https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html" style="font-size: 120%;">TESS GI Approved Programs Page</a>
</div>
      `);
  }
}
addLinkToCurrentGIPage();

