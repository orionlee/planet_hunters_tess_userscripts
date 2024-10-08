// ==UserScript==
// @name        Vizier Auto Search from URL
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @match       https://cdsarc.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @match       https://vizier.cfa.harvard.edu/viz-bin/VizieR-*?-source=*
// @noframes
// @grant       GM_addStyle
// @version     1.6.0
// @author      -
// @description Apply frequently used tweaks to Vizier Search form.
//              Perform auto-search a Vizier source when signified by hash.
//              Use cases includes creating URLs for Gaia DR3 variable on Vizier.
// @icon        https://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==

function isSearchForm() {
  // the URL for search form and search result is somewhat similar
  // So we use a heuristics, looking search form's checkboxes for columns to display
  return document.querySelector(`input[name="-out"][type="checkbox"]`);
}


function getSourceQueryParam() {
  let [, source] = location.search.match(/-source=([^&]+)/) || [null, ''];
  return decodeURIComponent(source);
}

const catalogColumnTweaksMap = {
  'I/355/gaiadr3': { // Gaia DR3
    // NSS: Non single star
    // IPDfmp: Percent of successful-IPD windows with more than one peak, high => likely binary
    'check': ['sepsi', 'RUWE', 'IPDfmp', 'Dup', 'VarFlag', 'NSS'],
    // Uncheck RA/DEC as well, because the columns RAJ2000 / DEJ2000 are generally more useful.
    'uncheck': ['RA_ICRS', 'DE_ICRS', 'e_RA_ICRS', 'e_DE_ICRS', 'e_Plx', 'e_pmRA', 'e_pmDE', 'FG', 'e_FG', 'FBP', 'e_FBP', 'FRP', 'e_FRP', 'QSO', 'Gal', 'And', 'Vbroad', 'GRVSmag'],
  },

  'I/355/paramp': { // Gaia DR3 astrophysical
    'check': [
      'SpType-ELS',  // spectral type from ESP-ELS
      'Evol', // Evolutionary stage of the star from FLAME using stellar models
      // For its value, refer to
      // https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_astrophysical_parameter_tables/ssec_dm_astrophysical_parameters.html#:~:text=evolstage_flame
      // for details (100: 0-age main sequence, 360: main sequence turnoff)
      'Flags-Flame', // Flags indicating quality and processing information from FLAME
    ],
  },

  'I/358/vclassre': { // Gaia DR3 Variable
    'check': ['ClassSc'],  // Classification score
  },
};


function selectPreferredColumns() {
  const source = getSourceQueryParam();

  let colsToUnCheck = []
  let colsToCheck = []

  for (const [catName, tweaks] of Object.entries(catalogColumnTweaksMap)) {
    if (source.indexOf(catName) < 0)  {
      continue; // catName not in the current form, skip it
    }
    const toCheckForCat = tweaks['check'];
    if (toCheckForCat) {
      colsToCheck = colsToCheck.concat(toCheckForCat);
    }
    const toUncheckForCat = tweaks['uncheck'];
    if (toUncheckForCat) {
      colsToUnCheck = colsToUnCheck.concat(toUncheckForCat);
    }
  }
  colsToUnCheck.forEach(col => {
    // note: in search result page, the inputs exist as input[name="-out"][type="hidden"], we don't want to change them
    document.querySelector(`input[name="-out"][type="checkbox"][value="${col}"]`).checked = false;
  });
  colsToCheck.forEach(col => {
    document.querySelector(`input[name="-out"][type="checkbox"][value="${col}"]`).checked = true;
  });
}

function doesSearchFormHasApplicableCatalogs() {
  const source = getSourceQueryParam();

  for (const catName in catalogColumnTweaksMap) {
    if (source.indexOf(catName) >= 0) {
      return true;
    }
  }
  return false;
}


function createUIForSelectPreferredColumns() {
  if (!isSearchForm()) {
    return;
  }

  if (!doesSearchFormHasApplicableCatalogs()) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', `
  <div style="position: fixed; right: 0px; top: 43px; padding: 0.75em 1ch; background-color: rgba(255, 255, 0, 0.8); z-index: 999; ">
    <button id="selectPreferredColumnsCtl" title-"Check preferred columns to show.">Preferred Columns</button>
  </div>`);
  document.getElementById('selectPreferredColumnsCtl').onclick = selectPreferredColumns;
}
createUIForSelectPreferredColumns();


function applyDefaultSearchFormTweaksForAll() {
  if (!isSearchForm()) {
    return;
  }
  // auto compute and sort by distance
  document.querySelector('#navcstout > input[name="-out.add"][value="_r"]').checked = true;
  document.querySelector('#navcstout > input[name="-sort"][value="_r"]').checked = true;
  // also compute position angle  θ
  document.querySelector('#navcstout > input[name="-out.add"][value="_p"]').checked = true;
}
applyDefaultSearchFormTweaksForAll();


function autoSubmitSearchFromHash() {
  if (location.hash.indexOf('autoSubmit=true') < 0) {
    return false;
  }

  // Vizier can fill in the form from URL. so we no longer need to do it here
  // but we still fill in some convenient tweaks
  try {
    applyDefaultSearchFormTweaksForAll();  // should have been done, but added here to be defensive
    selectPreferredColumns();
  } finally {
    if (document.querySelector('input[name="-c"]').value) {
      // auto click submit if coordinate has been supplied in the URL
      document.querySelector('input[type="submit"]').click();
    }
  }

  return true;
}

autoSubmitSearchFromHash();

