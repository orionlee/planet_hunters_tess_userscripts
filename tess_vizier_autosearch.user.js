// ==UserScript==
// @name        Vizier Auto Search from URL
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @match       https://vizier.u-strasbg.fr/viz-bin/VizieR-*?-source=*
// @match       https://cdsarc.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @noframes
// @grant       GM_addStyle
// @version     1.1.0
// @author      -
// @description Auto-search a Vizier source using the parameter from hash.
//              Use cases includes creating URLs for Gaia DR3 variable on Vizier.
// @icon        https://vizier.u-strasbg.fr/favicon.ico
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

  try {
    // change the radius to 120 arcsec (so that disatnces will be shown in arcsec)
    document.querySelector('select[name="-c.u"]').value = 'arcsec';
    document.querySelector('input[name="-c.r"]').value = 120;

    // auto compute and sort by distance
    document.querySelector('#navcstout > input[name="-out.add"][value="_r"]').checked = true;
    document.querySelector('#navcstout > input[name="-sort"][value="_r"]').checked = true;
  } finally {
    document.querySelector('input[type="submit"]').click();
  }

  return true;
}

autoSubmitSearchFromHash();

