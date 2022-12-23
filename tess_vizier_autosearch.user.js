// ==UserScript==
// @name        Vizier Auto Search from URL
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @match       https://vizier.u-strasbg.fr/viz-bin/VizieR-*?-source=*
// @match       https://cdsarc.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @noframes
// @grant       GM_addStyle
// @version     1.3.0
// @author      -
// @description Auto-search a Vizier source using the parameter from hash.
//              Use cases includes creating URLs for Gaia DR3 variable on Vizier.
// @icon        https://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==

function tweakGaiaDR3DefaultColumns() {
  let [, source] = location.search.match(/-source=([^&]+)/) || [null, ''];
  source = decodeURIComponent(source);
  if (!source.match('I/355/gaiadr3')) {
    return;
  }

  const colsToUnCheck = ['e_RA_ICRS', 'e_DE_ICRS', 'e_Plx', 'e_pmRA', 'e_pmDE', 'FG', 'e_FG', 'FBP', 'e_FBP', 'FRP', 'e_FRP', 'QSO', 'Gal', 'And'];
  const colsToCheck = ['sepsi', 'RUWE', 'Dup', 'VarFlag', 'NSS'];  // NSS: Non single star

  colsToUnCheck.forEach(col => {
    // note: in search result page, the inputs exist as input[name="-out"][type="hidden"], we don't want to change them
    document.querySelector(`input[name="-out"][type="checkbox"][value="${col}"]`).checked = false;
  });
  colsToCheck.forEach(col => {
    document.querySelector(`input[name="-out"][type="checkbox"][value="${col}"]`).checked = true;
  });
}


function autoSubmitSearchFromHash() {
  if (!location.hash.startsWith('#autoSubmit=true')) {
    return false;
  }

  // Vizier can fill in the form from URL. so we no longer need to do it here
  // but we still fill in some convenient tweak
  try {
    // auto compute and sort by distance
    document.querySelector('#navcstout > input[name="-out.add"][value="_r"]').checked = true;
    document.querySelector('#navcstout > input[name="-sort"][value="_r"]').checked = true;

    tweakGaiaDR3DefaultColumns();
  } finally {
    if (document.querySelector('input[name="-c"]').value) {
      // auto click submit if coordinate has been supplied in the URL
      document.querySelector('input[type="submit"]').click();
    }
  }

  return true;
}

autoSubmitSearchFromHash();

