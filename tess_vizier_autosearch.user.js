// ==UserScript==
// @name        Vizier Auto Search from URL
// @namespace   astro.tess
// @match       https://cdsarc.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @noframes
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description Auto-search a Vizier source using the parameter from hash.
//              Use cases includes creating URLs for Gaia DR3 variable on Vizier.
// @icon        https://cdsarc.cds.unistra.fr/favicon.ico
// ==/UserScript==


function autoSubmitSearchFromHash() {
  if (!location.hash.startsWith('#-c=')) {
    return false;
  }

  const searchTerm = decodeURIComponent(location.hash.replace(/^#-c=/, ''));
  if (!searchTerm) {
    return false;
  }
  document.querySelector('input[name="-c"]').value = searchTerm;

  document.querySelector('input[type="submit"]').click();
  return true;
}

autoSubmitSearchFromHash();
