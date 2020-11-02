// ==UserScript==
// @name        TESS - ASAS-SN Variable tweak
// @namespace   astro.tess
// @match       https://asas-sn.osu.edu/variables
// @grant       GM_addStyle
// @version     1.0
// @author      orionlee
// @description
// ==/UserScript==

if (location.search) {
  // cae the page has query string params, i.e., a search is done
  // make search result above the fold

  // - hide decorative UIs that take up vertical space
  GM_addStyle(`
.project-banner {
  display: none;
}
`);

  // - hide the search form to surface the result
  document.querySelector('button.panel-header-btn').click();
  // setTimeout(() => {
  // }, 1000);
}
