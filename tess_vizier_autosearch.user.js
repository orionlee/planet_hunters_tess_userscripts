// ==UserScript==
// @name        Vizier Auto Search from URL
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @match       https://vizier.u-strasbg.fr/viz-bin/VizieR-*?-source=*
// @match       https://cdsarc.cds.unistra.fr/viz-bin/VizieR-*?-source=*
// @noframes
// @grant       GM_addStyle
// @version     1.4.1
// @author      -
// @description Auto-search a Vizier source using the parameter from hash.
//              Use cases includes creating URLs for Gaia DR3 variable on Vizier.
// @icon        https://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==

function tweakDefaultColumns() {
  let [, source] = location.search.match(/-source=([^&]+)/) || [null, ''];
  source = decodeURIComponent(source);

  let colsToUnCheck = []
  let colsToCheck = []

  if (source.match('I/355/gaiadr3')) {
    // tweaks for Gaia DR3 main table
    colsToUnCheck = colsToUnCheck.concat(
      ['e_RA_ICRS', 'e_DE_ICRS', 'e_Plx', 'e_pmRA', 'e_pmDE', 'FG', 'e_FG', 'FBP', 'e_FBP', 'FRP', 'e_FRP', 'QSO', 'Gal', 'And']
    );
    colsToCheck = colsToCheck.concat(
      ['sepsi', 'RUWE', 'Dup', 'VarFlag', 'NSS'] // NSS: Non single star
    );
  }

  if (source.match('I/355/paramp')) {
    // tweaks for Gaia DR3 Astrophysical parameters
    colsToCheck = colsToCheck.concat(
      ['SpType-ELS',  // spectral type from ESP-ELS
       'Evol', // Evolutionary stage of the star from FLAME using stellar models
       // For its value, refer to
       // https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_astrophysical_parameter_tables/ssec_dm_astrophysical_parameters.html#:~:text=evolstage_flame
       // for details (100: 0-age main sequence, 360: main sequence turnoff)
       'Flags-Flame', // Flags indicating quality and processing information from FLAME
      ]
    );
  }

  if (source.match('I/358/vclassre')) {
    // tweaks for Gaia DR3 Variable main table
    colsToCheck = colsToCheck.concat(
      ['ClassSc']  // Classification score
    );
  }


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

    tweakDefaultColumns();
  } finally {
    if (document.querySelector('input[name="-c"]').value) {
      // auto click submit if coordinate has been supplied in the URL
      document.querySelector('input[type="submit"]').click();
    }
  }

  return true;
}

autoSubmitSearchFromHash();

