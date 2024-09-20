// ==UserScript==
// @name        TESS - ExoFOP tweak
// @namespace   astro.tess
// @match       https://exofop.ipac.caltech.edu/tess/target.php?id=*
// @match       https://exofop.ipac.caltech.edu/tess/gototicid.php?target=*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_openInTab
// @grant       GM_getValue
// @grant       GM_setValue
// @noframes
// @version     1.51.2
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

//
// The special case logic for /tess/gototicid.php
//

function tweakGotoCidMultiResult() {
  if (!(location.pathname == "/tess/gototicid.php")) {
    return;
  }

  // case gotocid with matching multiple TIC IDs

  function propagateHash() {
    if (!location.hash) {
      return; // No hash, no-op
    }
    document.querySelectorAll('table.tfop tr > td:nth-of-type(1) a').forEach((a) => {
      a.href += location.hash;
    });
  }

  propagateHash();
}
tweakGotoCidMultiResult();


//
// The special case logic for search by Gaia DR3 source, and no TIC is found
//

function tweakNoTicFoundResult() {
  let [, id ] = location.href.match(/target[.]php[?]id=([^&#]+)/) || [null, null];
  if (!id) {
    return;
  }
  // case search by ID
  //  For values in the form of "Gaia+DR3+5427722829648905088"
  //  the + sign is not decoded as space.
  //  regex is used to compensate it
  id = decodeURIComponent(id).replace(/[+]/g, ' ');

  // For search by Gaia DR3 source,
  // if no TIC object found,
  // add a link to Search Gaia DR2
  // (On ExoFOP, somehow some Gaia DR3 source searches are successful, and some fail.)
  // e.g., https://exofop.ipac.caltech.edu/tess/target.php?id=Gaia%20DR3%205523326533908997760

  if (!id.startsWith("Gaia DR3 ")) {
    return;
  }

  // the selector would get to error message text if that's the case
  // and just some spaces for normal case (that the id is found)
  const maybeErrMsg = document.querySelector('a[name="top"] + table')?.nextSibling?.textContent;
  if (!maybeErrMsg?.startsWith("No TIC object found")) {
    return;
  }

  const newId = id.replace('DR3', 'DR2');
  let newUrl = `?id=${encodeURIComponent(newId)}${location.hash}`;
  document.body.insertAdjacentHTML('beforeend', `
<div style="margin-top: 10px;">
    Search for <a href="${newUrl}">${newId}</a> instead.
</div>`);
  document.title = "(0) " + document.title;  // signify TIC not found in the title.
}
tweakNoTicFoundResult();


// --------------------------------------------------

//
// The primary logic, for /tess/target.php?id=*
// - it will still run for case URL is /tess/gototicid.php variant,
//   and spits out error.
// - The errors don't affect users so it's left alone for now.
//

// A copy from tess_exomast_tce_tweak.user.js
function bjtdToRelative(tBjtd) {
  // list of [sector, start in bjtd, stop in bjtd]
  const sectorStartStopList = [
    [1, 1325.293656167129, 1353.176978345185],
    [2, 1354.101978098092, 1381.514471377755],
    [3, 1382.033915694891, 1409.38390899393],
    [4, 1410.900575289127, 1436.850568935196],
    [5, 1437.97695754836, 1464.288062220275],
    [6, 1468.270005690386, 1490.045000362693],
    [7, 1491.625533688852, 1516.086634607482],
    [8, 1517.340800716288, 1542.000512587478],
    [9, 1543.215789885416, 1568.47550172897],
    [10, 1569.431056949387, 1595.681045762102],
    [11, 1596.7713230764, 1623.89214487873],
    [12, 1624.949088895904, 1652.892132567643],
    [13, 1653.914354218704, 1682.357397648383],
    [14, 1683.354083284844, 1710.205139093854],
    [15, 1711.364832467267, 1737.410234286213],
    [16, 1738.651878977214, 1763.319505048531],
    [17, 1764.68338040615, 1789.694124092899],
    [18, 1790.655222679167, 1815.01333085682],
    [19, 1816.076783817437, 1841.148995516928],
    [20, 1842.502169661221, 1868.821776019856],
    [21, 1870.432903042675, 1897.780481441975],
    [22, 1899.316615649818, 1926.493453997528],
    [23, 1928.114314364589, 1954.875850260758],
    [24, 1955.795314077534, 1982.281731227418],
    [25, 1983.635909133659, 2009.306869200418],
    [26, 2010.266979188743, 2035.135354240565],
    [27, 2036.279092559588, 2060.643443703498],
    [28, 2061.855819071128, 2087.103119925926],
    [29, 2088.240389614362, 2114.42783612537],
    [30, 2115.884264538392, 2143.207661774344],
    [31, 2144.514258888768, 2169.944432468459],
    [32, 2174.227109325049, 2200.218976081749],
    [33, 2201.72730, 2227.57173],
    [34, 2228.766579577884, 2254.065591600167],
    [35, 2254.994772551864, 2279.979866029939],
    [36, 2280.89808, 2305.98835],
    [37, 2307.265451933772, 2332.58443261356],
    [38, 2333.870701993338, 2360.544306094672],
    [39, 2361.771115909602, 2389.718112727824],
    [40, 2390.651932008792, 2418.853345967057],
    [41, 2419.991340606181, 2446.581939569297],
    [42, 2447.693923423322, 2472.894041288473],
    [43, 2474.169439849224, 2498.87879495011],
    [44, 2500.200386195426, 2524.440224385859],
    [45, 2526.008304338289, 2550.626017644947],
    [46, 2552.327574315761, 2578.704949836531],
    [47, 2579.820451228846, 2606.945832996815],
    [48, 2607.93782493873, 2635.991052207522],
    [49, 2637.477835373729, 2664.320530030225],
    [50, 2665.276031989969, 2691.5154814254],
    [51, 2692.966536262185, 2717.540385317604],
    [52, 2718.633952527452, 2743.075903463609],
    [53, 2743.995359745024, 2768.97906121931],
    [54, 2769.898524745069, 2796.129475030413],
    [55, 2797.100319978378, 2824.26453933892],
    [56, 2825.25760212576, 2853.139721496374],
    [57, 2853.357238613667, 2882.118102004557],
    [58, 2882.330080451638, 2910.049198780624],
    [59, 2910.263299429459, 2936.686334701882],
    [60, 2936.907891589253, 2962.588685896838],
    [61, 2962.80303655728, 2988.223714526404],
    [62, 2988.440460311798, 3014.152916666788],
    [63, 3014.368194307376, 3040.900033122704],
    [64, 3041.113921605863, 3068.031827870399],
    [65, 3068.738768663089, 3096.628878281164],
    [66, 3097.677432652252, 3126.43202426848],
    [67, 3126.641223703411, 3154.395296351746],
    [68, 3154.624463203424, 3182.1258282391],
    [69, 3182.359304073385, 3208.144960288095],
    [70, 3208.372104075746, 3233.824170369739],
    [71, 3234.040911246744, 3259.956805719784],
    [72, 3260.179701687097, 3285.5695191398],
    [73, 3285.80283470647, 3312.654312141076],
    [74, 3312.860307801986, 3339.56635102599],
    [75, 3339.783589963035, 3367.482548586369],
    [76, 3367.702162214764, 3394.781234959809],
    [77, 3395.489836975548, 3423.552806059362],
    [78, 3434.273456882445, 3452.324736751044],
    [79, 3452.54001180836, 3479.675616851261],
    [80, 3479.888612793425, 3506.337662618164],
    [81, 3506.553770694337, 3533.179010941296],
  ]; // Based on the one in tess_exomast_tce_tweak.user.js


  for (const row of sectorStartStopList) {
    if (row[1] <= tBjtd && tBjtd <= row[2]) {
      return [row[0], tBjtd - row[1]];
    }
  }
  // not found
  return [null, null];
} // function bjtdToRelative(..)

function bjdToBjtd(bjd) {
  return bjd - 2457000.0;
}

function bjdToBtjdAndRelativeStr(bjd) {
  const btjd = bjdToBjtd(bjd);
  const btjdRes = `${btjd.toFixed(3)}`;
  const [sector, timeRel] = bjtdToRelative(btjd);
  if (sector) {
    return `${btjdRes}; sector ${sector}, ${timeRel.toFixed(3)} d`;
  } else {
    return btjdRes;
  }
}


function my_GM_getValue(key, defaultValue="") {
  const result = GM_getValue(key);
  if (!result) {
    // Store a empty string so that the value can be edited in Tampermonkey UI
    GM_setValue(key, "");
    return defaultValue;
  }
  return result;
}


function getTic() {
  // the query string id=? is usually TIC, but it could also be
  // Gaia DR2 / DR3 source
  // const[, tic] = location.search.match(/id=(\d+)/) || [null, null];
  const ticStr = document.querySelector('.overview_tid').textContent || '';
  const[, tic] = ticStr.match(/TIC (\d+)/) || [null, null];
  return tic;
}

// Normalize the IDs to the canonical form when needed
function normalizeAlias(aliasText) {
  let res = aliasText.trim();
  if (res.startsWith('TYC')) {
    // for TYC, remove leading zeros, e.g., 123-01234
    // both SIMBAD and VSX use the version without leading zeros
    res = res.replace(/(-|TYC )0+(\d+)/g, '$1$2');
  }
  if (res.startsWith('WISE J')) {
    // The WISE ids actually are allWISE ids
    // use the allWISE ids format adopted by SIMBAD and VSX
    res = res.replace(/^WISE J/, 'WISEA J');
  }
  if (res.startsWith('GSC ')) {
    // for GSC, we need to pad with leading zeros, e.g.,
    // for GSC 8763-00475 , 8673 is padded to 08763
    // both SIMBAD and VSX use the version with leading zeros

    let [, str1, str2] = res.match(/GSC (\d+)-(\d+)/) || [null, null, null];
    if (str1 && str2) {
      str1 = str1.padStart(5, '0');
      str2 = str2.padStart(5, '0');
      res = `GSC ${str1}-${str2}`;
    } else {
      console.warn(`normalizeAlias(): failed for ${res} ; No-op`);
    }
  }
  if (res.startsWith('SD-')) {
    // SD ies equivalent to BD, the one used in SIMBAD / VSX
    // https://cds.unistra.fr/cgi-bin/Dic-Simbad?SD
    // (Sometimes a TIC has both SD and BD names,
    //  this normalization doesn't hurt matching, in the sense
    //  that SIMBAD / VSX basically all use BD.)
    res = res.replace(/^SD-/, 'BD-');
  }
  if (res.startsWith('WDS')) {
    // remove space not used by SIMBAD
    // e.g., WDS J16167+6714 B => WDS J16167+6714B
    res = res.replace(/(WDS J\d+[+-]\d+)\s+(\w+)/g, '$1$2');
  }

  // SDSS note:
  // normalization is does not seem to be possible
  // - ExoFOP uses a DR-specific ID, e.g.,
  //     SDSS DR9 1237662225672700035  (for TIC 900138348)
  // - SIMBAD uses a coordinate-based ID, e.g.
  //     SDSS J111511.99+392144.0
  return res;
} // function normalizeAlias(..)

//
// Generate modified SIMBAD URLs to pass along TIC's identifiers, etc.
// to aid in checking the result from SIMBAD link refers to the same object or not.
// (The SIMBAD link is coordinate-based, so at times it might be off target if there are nearby stars.)
//
function getAliasesList() {
  let aliasesText = document.querySelector('.overview_header > span:nth-of-type(1) > ul >li:nth-of-type(1)')?.textContent;
  if (!aliasesText) {
    console.error('getAliasesList(): cannot find aliases. No-op');
    return;
  }
  aliasesText = aliasesText.replace('Star Name(s): ', '').trim();
  return aliasesText.split(',').map(t => normalizeAlias(t));
}

function getDistance() {
  // distance: 18th column of the table of the stellar parameters table
  const headerText = document.querySelector('#myGrid4 div.ag-header-container > div:nth-of-type(1) > div:nth-of-type(18)')?.textContent?.trim();
  if (headerText != "Distance (pc)") {
    console.warn('getDistance(): the identified column is not distance. Actual: ' + headerText);
    return '';
  }

  const res = document.querySelector('#myGrid4 div.ag-center-cols-container > div:nth-of-type(1) > div:nth-of-type(18)')?.textContent;
  return res || '';
} // function getDistance()


function getBandMagnitudeMap() {
  const rowEls = Array.from(document.querySelectorAll(`#myGrid6 div.ag-center-cols-container > div`));
  const res = {}  // band: magnitude map
  rowEls.forEach(rowEl => {
    // round the magnitude for ease of visual matching
    res[rowEl.querySelector('div:nth-child(1)').textContent] =
      parseFloat(rowEl.querySelector('div:nth-child(2)').textContent)?.toFixed(2);
  });
  return res;
}

function getOtherParams() {

  function getMagnitudes() {
    // try to get magnitudes in B and V bands, more likely to match SIMBAD data
    // if not available, provide a few backup
    const magMap = getBandMagnitudeMap();
    let res = "";
    let bandUsed = 0;
    if (magMap['B']) {
      res += `B:${magMap['B']}, `;
      bandUsed++;
    }
    if (magMap['V']) {
      res += `V:${magMap['V']}, `
      bandUsed++;
    }
    if ((bandUsed < 2) && (magMap['Gaia'])) {
      res += `G:${magMap['Gaia']}, `
      bandUsed++;
    }
    if ((bandUsed < 2) && (magMap['TESS'])) {
      res += `T:${magMap['Gaia']}, `
      bandUsed++;
    }
    return res;
  }

  function getProperMotion() {
    // get PM without error
    // '7.54136 <span class="error">± 0.075189</span><br>-65.6934 <span class="error">± 0.07388</span>'
    let pmText = document.querySelector('.overview_header > span:nth-of-type(2) > ul > li:last-of-type table tr:first-of-type')?.textContent || '';
    pmText = pmText.replace(/\n/g, '').trim();
    return pmText;
  }

  return `Distance(pc): ${getDistance()} ; PM: ${getProperMotion()}; Magnitudes: ${getMagnitudes()} ;`;
} // function getOtherParams()


function getCoord() {
  // coordUiCtrIdx: for TIC with TOI, there is an extra box before the coordinate box, so a different CSS selector is needed.
  // so the CSS selector used to  locate the coordinate UI varies.
  // The coordUiCtrIdx is used to pass the information to relevant caller, currently
  // the one in constructing copy coordinate UI.
  let raDecEl = document.querySelector('.overview_header > span:nth-of-type(2) > ul > li:nth-of-type(1)');
  let coordUiCtrIdx = 2
  if (!raDecEl) {
    raDecEl = document.querySelector('.overview_header > span:nth-of-type(3) > ul > li:nth-of-type(1)');
    coordUiCtrIdx = 3
  }
  const raDecMatch = raDecEl?.textContent?.match(/:\n([0-9:.]+)\s([0-9:.+-]+)\s+[(]([0-9.+-]+)°\s*([0-9.+-]+)°/);
  if (raDecMatch) {
    return {
             ra:      raDecMatch[1],
             dec:     raDecMatch[2],
             ra_deg:  raDecMatch[3],
             dec_deg: raDecMatch[4],
             uiCtrIdx: coordUiCtrIdx,
           };
  }
  console.warn('getCoord() - cannot find coordinate: ', raDecEl);
  return null;
}
const coord = getCoord();


function addExternalLInks() {
  const simbadLinkEl = document.querySelector('a[target="simbad"]');


  if (simbadLinkEl) {
    // Change SIMBAD link to https . It probably should have been in its own function.
    simbadLinkEl.href = simbadLinkEl.href.replace("http://", "https://");

    // e.g., CFA mirror, "simbad.cfa.harvard.edu"
    const simmbadHost = my_GM_getValue("simbadHost");
    if (simmbadHost) {
      simbadLinkEl.href = simbadLinkEl.href.replace(/^https:\/\/[^/]+/, `https://${simmbadHost}`);
    }

    // Note: Probably no longer needed. ExoFOP has fixed the issue
    // fix simbad urls, with
    // for star with ra or dec between -1, and 1, the ExoFOP generated link
    // is in the form of ".../sim-coo?Coord=<ra>+-.665&Radius=2...", there is no "0" before the "."
    // SIMBAD, however, requires the 0 before the "."
    // for -1 < DEC < 1, e.g., -.123 => -0.123 ; .123 => 0.123
    //// simbadLinkEl.href = simbadLinkEl.href.replace(/(\d[+]-?)[.](\d)/, '$10.$2');
    // for -1 < RA < 1
    //// simbadLinkEl.href = simbadLinkEl.href.replace(/(Coord=-?)[.](\d)+/, '$10.$2');
  } else {
    console.warn('Cannot find Links to SIMBAD');
  }

    // add links to SIMBAD, VSX, etc.  to the top

  const vsxUrl = 'https://www.aavso.org/vsx/index.php?view=search.top' +
    ((coord != null) ? `#coord=${encodeURIComponent(coord.ra + ' ' + coord.dec)}`  : '');

  const asasSnUrl = 'https://asas-sn.osu.edu/variables' +
    ((coord != null) ?
        `?ra=${encodeURIComponent(coord.ra)}&dec=${encodeURIComponent(coord.dec)}&radius=2` +
        '&vmag_min=&vmag_max=&amplitude_min=&amplitude_max=&period_min=&period_max=&lksl_min=&lksl_max=&class_prob_min=&class_prob_max=' +
        '&parallax_over_err_min=&parallax_over_err_max=&name=&references[]=I&references[]=II&references[]=III&references[]=IV&references[]=V&references[]=VI' +
        '&sort_by=distance&sort_order=asc&show_non_periodic=true&show_without_class=true&asassn_discov_only=false&'
        : '');

  const gaiaId = (() => {
    let res = null;
    getAliasesList().forEach( (alias) => {
      const [, id] = alias.match(/Gaia DR2 ([0-9]+)/) || [null, null];
      if (id) {
        res = id;
      }

    });
    return res;
  })();

  const appendGaiaIdForMatch = (url) => {
    if (gaiaId) {
      if (url.indexOf("#") < 0) {
        url = url + '#';
      }
      return url + `&matchString=${encodeURIComponent(gaiaId)}`;
    } else {
      return url;
    }
  };


  // or vizier.u-strasbg.fr,
  const vizierHost = my_GM_getValue("vizierHost", "vizier.cds.unistra.fr");

  // Gaia DR3 variables, query the following tables
  // - vclassre: main classification
  // - varisum:  basic params (magnitudes, whether it's classified to specific subtypes)
  // - veb: eclipsing binary params
  // - vcc: eclipsing binary with compact companion
  // - vst: short time scaled sources params (sometimes EB like variability goes there)
  // documentation: https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_variability_tables/
  let gaiaDr3VarUrl = `https://${vizierHost}/viz-bin/VizieR-3?-source=+I%2F358%2Fvarisum+I%2F358%2Fvclassre+I%2F358%2Fveb+I%2F358%2Fvcc+I%2F358%2Fvst` +
    ((coord != null) ? `&-c=${encodeURIComponent(coord.ra + ' ' + coord.dec)}&-c.r=60&-c.u=arcsec#autoSubmit=true`  : '');
  gaiaDr3VarUrl = appendGaiaIdForMatch(gaiaDr3VarUrl);

  // Gaia DR3, query 2 tables
  // - gaiadr3: the main
  // - paramp: astrophysical params such as radius, mass, luminosity, etc.
  // Note: the default columns are tweaked by tess_vizier_autosearch.usr.js
  let gaiaDr3Url = `https://${vizierHost}/viz-bin/VizieR-3?-source=+I%2F355%2Fgaiadr3+I%2F355%2Fparamp` +
    ((coord != null) ? `&-c=${encodeURIComponent(coord.ra + ' ' + coord.dec)}&-c.r=15&-c.u=arcsec#autoSubmit=true`  : '');
  gaiaDr3Url = appendGaiaIdForMatch(gaiaDr3Url);

  // Gaia DR3 Non Single Star
  const coordStrEncoded = (coord != null) ? encodeURIComponent(coord.ra + ' ' + coord.dec) : '';
  // The following long URL would query all NSS tables
  let gaiaDr3NSSUrl = `https://${vizierHost}/viz-bin/VizieR-4?-ref=VIZ654d41d6a6ba&-to=-4b&-from=-3&-this=-4&%2F%2Fsource=I%2F357&%2F%2Ftables=I%2F357%2Ftboasb1c&%2F%2Ftables=I%2F357%2Ftboeb&%2F%2Ftables=I%2F357%2Ftboes&%2F%2Ftables=I%2F357%2Ftbooc&%2F%2Ftables=I%2F357%2Ftbooac&%2F%2Ftables=I%2F357%2Ftbooavc&%2F%2Ftables=I%2F357%2Ftbootsc&%2F%2Ftables=I%2F357%2Ftbootsvc&%2F%2Ftables=I%2F357%2Ftbosb1&%2F%2Ftables=I%2F357%2Ftbosb1c&%2F%2Ftables=I%2F357%2Ftbosb2&%2F%2Ftables=I%2F357%2Ftbosb2c&%2F%2Ftables=I%2F357%2Facc7&%2F%2Ftables=I%2F357%2Facc9&%2F%2Ftables=I%2F357%2Flinspec1&%2F%2Ftables=I%2F357%2Flinspec2&%2F%2Ftables=I%2F357%2Fvimfl&-out.max=50&%2F%2FCDSportal=http%3A%2F%2Fcdsportal.u-strasbg.fr%2FStoreVizierData.html&-out.form=HTML+Table&%2F%2Foutaddvalue=default&-order=I&-oc.form=sexa&-nav=cat%3AI%2F357%26tab%3A%7BI%2F357%2Ftboasb1c%7D%26tab%3A%7BI%2F357%2Ftboeb%7D%26tab%3A%7BI%2F357%2Ftboes%7D%26tab%3A%7BI%2F357%2Ftbooc%7D%26tab%3A%7BI%2F357%2Ftbooac%7D%26tab%3A%7BI%2F357%2Ftbooavc%7D%26tab%3A%7BI%2F357%2Ftbootsc%7D%26tab%3A%7BI%2F357%2Ftbootsvc%7D%26tab%3A%7BI%2F357%2Ftbosb1%7D%26tab%3A%7BI%2F357%2Ftbosb1c%7D%26tab%3A%7BI%2F357%2Ftbosb2%7D%26tab%3A%7BI%2F357%2Ftbosb2c%7D%26tab%3A%7BI%2F357%2Facc7%7D%26tab%3A%7BI%2F357%2Facc9%7D%26tab%3A%7BI%2F357%2Flinspec1%7D%26tab%3A%7BI%2F357%2Flinspec2%7D%26tab%3A%7BI%2F357%2Fvimfl%7D%26key%3Asource%3DI%2F357%26pos%3A${coordStrEncoded}%28+15+arcsec+J2000%29%26HTTPPRM%3A&-c=${coordStrEncoded}&-c.eq=J2000&-c.r=+15&-c.u=arcsec&-c.geom=r&-source=&-out.src=I%2F357%2Ftboasb1c%2CI%2F357%2Ftboeb%2CI%2F357%2Ftboes%2CI%2F357%2Ftbooc%2CI%2F357%2Ftbooac%2CI%2F357%2Ftbooavc%2CI%2F357%2Ftbootsc%2CI%2F357%2Ftbootsvc%2CI%2F357%2Ftbosb1%2CI%2F357%2Ftbosb1c%2CI%2F357%2Ftbosb2%2CI%2F357%2Ftbosb2c%2CI%2F357%2Facc7%2CI%2F357%2Facc9%2CI%2F357%2Flinspec1%2CI%2F357%2Flinspec2%2CI%2F357%2Fvimfl&-x.rs=10&-source=I%2F357%2Ftboasb1c+I%2F357%2Ftboeb+I%2F357%2Ftboes+I%2F357%2Ftbooc+I%2F357%2Ftbooac+I%2F357%2Ftbooavc+I%2F357%2Ftbootsc+I%2F357%2Ftbootsvc+I%2F357%2Ftbosb1+I%2F357%2Ftbosb1c+I%2F357%2Ftbosb2+I%2F357%2Ftbosb2c+I%2F357%2Facc7+I%2F357%2Facc9+I%2F357%2Flinspec1+I%2F357%2Flinspec2+I%2F357%2Fvimfl&-out.orig=standard&-out=Source&Source=&-out=NSSmodel&-out=RA_ICRS&-out=DE_ICRS&-out=Plx&-out=pmRA&-out=pmDE&-out=ATI&-out=BTI&-out=FTI&-out=GTI&-out=CTI&-out=HTI&-out=Per&-out=Tperi&-out=ecc&-out=Vcm&-out=Flags&-out=_RA.icrs&-out=_DE.icrs&-out=ffactp&-out=ffacts&-out=inc&-out=Tratio&-out=Teclp&-out=Tecls&-out=Durp&-out=Durs&-out=K1&-out=MassRatio&-out=K2&-out=dpmRA&-out=dpmDE&-out=ddpmRA&-out=ddpmDE&-out=Velmean&-out=dVel%2Fdt&-out=dVel%2Fdt2&-out=RAVIM&-out=DEVIM&-meta.ucd=2&-meta=1&-meta.foot=1&-meta.form=1&-usenav=1&-bmark=GET`;
  gaiaDr3NSSUrl = appendGaiaIdForMatch(gaiaDr3NSSUrl);

  // Gaia DR3 cross-matched with 100+ Variable Star Catalogs
  // https://ui.adsabs.harvard.edu/abs/2023A%26A...674A..22G/abstract
  let gaiaDr3XmatchVarUrl = `https://${vizierHost}/viz-bin/VizieR-4?-ref=VIZ65ea51f497bf&-to=-4b&-from=-3&-this=-4&%2F%2Fsource=J%2FA%2BA%2F674%2FA22%2Fcatalog&%2F%2Ftables=J%2FA%2BA%2F674%2FA22%2Fcatalog&-out.max=50&%2F%2FCDSportal=http%3A%2F%2Fcdsportal.u-strasbg.fr%2FStoreVizierData.html&-out.form=HTML+Table&-out.add=_r&%2F%2Foutaddvalue=default&-sort=_r&-order=I&-oc.form=sexa&-out.src=J%2FA%2BA%2F674%2FA22%2Fcatalog&-nav=cat%3AJ%2FA%2BA%2F674%2FA22%26tab%3A%7BJ%2FA%2BA%2F674%2FA22%2Fcatalog%7D%26key%3Asource%3DJ%2FA%2BA%2F674%2FA22%2Fcatalog%26pos%3A${coordStrEncoded}%28+120+arcsec+J2000%29%26HTTPPRM%3A&-c=${coordStrEncoded}&-c.eq=J2000&-c.r=+120&-c.u=arcsec&-c.geom=r&-source=&-source=J%2FA%2BA%2F674%2FA22%2Fcatalog&-out=GaiaDR3&-out=ONames&-out=RAJ2000&-out=DEJ2000&-out=Omags&-out=psuperclass&psuperclass=%21%3D%2CCST%2CAGN%2CGALAXY&-out=pvarTypes&-out=VarTypes&-out=VarTypesOri&-out=AltVarTypesOri&-out=pPer&-out=OPers&-out=ORefEpoch&-out=Cats&-out=Sel&-meta.ucd=2&-meta=1&-meta.foot=1&-usenav=1&-bmark=GET`;
  gaiaDr3XmatchVarUrl = appendGaiaIdForMatch(gaiaDr3XmatchVarUrl);

  const tic = getTic();

  // The auto fill form / submit for WTV2 requires a userscript to work
  const wtv2Url = 'https://heasarc.gsfc.nasa.gov/wsgi-scripts/TESS/TESS-point_Web_Tool/TESS-point_Web_Tool/wtv_v2.0.py/' +
    `#autoFillForm=/wsgi-scripts/TESS/TESS-point_Web_Tool/TESS-point_Web_Tool/wtv_v2.0.py/TICID_result&_i_tic=${tic}&autoSubmit=`;

  const tceUrl = (() => {
    // The URL can be optionally overridden in the script global store.
    // It can be edited at:
    // - ViolentMonkey: "Values" tab of the script.
    // - TamperMonkey:  "Storage" tab of the script.
    // e.g., use https://tess-tces-fqhnyorhza-uw.a.run.app/tces?tic=
    const urlPrefix = my_GM_getValue("tceUrlPrefix", "https://exo.mast.stsci.edu/#search=TIC ");
    return `${urlPrefix}${tic}`;
  })();

  const tessEbUrl = (() => {
    // alternative: Vizier's static TESS EB
    // https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-source=J/ApJS/258/16/tess-ebs&TIC=
    const urlPrefix = my_GM_getValue("tessEbUrlPrefix", "http://tessebs.villanova.edu/search_results?tic=");
    return `${urlPrefix}${tic}`;
  })();

  // &zoom=200 : zoom at the scale of a large constellation
  const wwTelUrl = 'http://www.worldwidetelescope.org' +
    ((coord != null) ?
    `/wwtweb/goto.aspx?ra=${coord.ra_deg}&dec=${coord.dec_deg}&zoom=200`
    : '');

  document.getElementById('extraExternalLinksCtr')?.remove();  // to support redo
  document.querySelector('a[href="/tess"]').insertAdjacentHTML('afterend', `\
<span id="extraExternalLinksCtr" style="background-color: #ccc; padding: 0.3em 2ch;">
  ${simbadLinkEl?.outerHTML?.replace('>\nSIMBAD<', ' accesskey="S"> SIMBAD<')} |
  <a href="${vsxUrl}" target="_vsx" accesskey="V" title="Variable Star Index">VSX</a> |
  <a href="${asasSnUrl}" target="_asas-sn" accesskey="A" title="All-Sky Automated Survey for Supernovae">ASAS-SN</a> |
  <a href="${gaiaDr3VarUrl}" target="_gaia-dr3-var" accesskey="G" title="Gaia DR3 Variables">GDR3 Var</a> |
  <a href="${tessEbUrl}" target="_tess-eb" accesskey="T">TESS-EB</a> |
  <a href="http://cdsportal.u-strasbg.fr/gadgets/ifr?url=http://cdsportal.unistra.fr/widgets/SED_plotter.xml&SED_plot_object=TIC${tic}&SED_plot_radius=5"
    target="_sed" title="Spectral Energy Distributions Plot">SED</a>  |
  <a href="${gaiaDr3Url}" target="_gaia-dr3" title="Gaia DR3 Main">GDR3</a> |
  <a href="${gaiaDr3NSSUrl}" target="_gaia-dr3-nss" title="Gaia DR3 Non Single Star">NSS</a> |
  <a href="${gaiaDr3XmatchVarUrl}" target="_gaia-dr3-xmatch-var" title="Gaia DR3 XMatch Variable Catalogs">XMatch-Var</a> |
  <a href="https://tev.mit.edu/data/search/?q=${tic}" target="_tev"
    title="To MIT TEV: it contains similar information; but it also has QLP validation reports when applicable">MIT TEV</a> |
  <a href="https://${vizierHost}/viz-bin/VizieR-4?-ref=VIZ655abdcb3f53ce&-to=-4b&-from=-2&-this=-4&%2F%2Fsource=J%2FAJ%2F156%2F234&%2F%2Ftables=J%2FAJ%2F156%2F234%2Ftable4&-out.max=50&%2F%2FCDSportal=http%3A%2F%2Fcdsportal.u-strasbg.fr%2FStoreVizierData.html&-out.form=HTML+Table&%2F%2Foutaddvalue=default&-order=I&-oc.form=sexa&-out.src=J%2FAJ%2F156%2F234%2Ftable4&-nav=cat%3AJ%2FAJ%2F156%2F234%26tab%3A%7BJ%2FAJ%2F156%2F234%2Ftable4%7D%26key%3Asource%3DJ%2FAJ%2F156%2F234%26HTTPPRM%3A&-c=&-c.eq=J2000&-c.r=++2&-c.u=arcmin&-c.geom=r&-source=&-source=J%2FAJ%2F156%2F234%2Ftable4&-out=KELT&-out=2MASS&-out=TIC&TIC=${tic}&-out=FName&-out=FNum&-out=RAJ2000&-out=DEJ2000&-out=Per&-out=Dur&-out=TDepth&-out=RVAmp&-meta.ucd=2&-meta=1&-meta.foot=1&-usenav=1&-bmark=GET"
    target="_kelt_fp" title="KELT Transit FPs">KELT</a> |
  <a href="${tceUrl}"
    target="_tce" title="TCEs on Exo.MAST">TCE</a>  |
  <a href="https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/search?query=TIC ${tic}"
    target="_pht_talk" title="Planet Hunters TESS Talk">PHT</a>  |
  <a href="${wtv2Url}"
    target="_wtv2" title="TESS Web Visibility Tool v2, that supports sectors 70+">WTV2</a> |
  <a href="${wwTelUrl}"
    target="_wwTel" title="Worldwide Telescope, more for exploration of the target's general area / constellation">WWT</a> |
  <svg style="height: 1em; width: 1em;"  class="svg-inline--fa fa-external-link-alt fa-w-18" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
</span>`);
// ^^^ Note: the SED link passes TIC id without space `&SED_plot_object=TIC${tic}` deliberately
//           because the SED site's redirection seemed to mishandle spaces.
//           Having a space in the TIC would end up with an invalid URL.
// ^^^ Note 2: svg height/width style is needed to work with Firefox

  // Add aliases to all external catalog links
  const hashToAdd = `#aliases=${getAliasesList()}&other_params=${getOtherParams()}`;
  Array.from(document.querySelectorAll('a[target="simbad"]'),
    (a) => {
      let href = a.href;
      // remove existing hash if any, needed for the original SIMBAD link below the fold
      href = href.replace(/#.*$/, '');
      href += hashToAdd;
      a.href = href;
    }
  );
  // for VSX , ASAS-SN, I must append to the existing href,
  //as they  already have some hashes that need to be preserved
  Array.from(document.querySelectorAll('a[target="_vsx"], a[target="_asas-sn"]'),
    (a) => a.href += hashToAdd);

} // function addExternalLinks()
addExternalLInks();

//
// Show V, Gaia, above the fold for ease of access
// Also derive absolute magnitude, B-V index (for spectral type estimation)
//
function tweakMag() {
  // where the output is added to:
  // mag info section in Basic info: "TESS mag: ..."
  const anchorEl = document.querySelector(".overview_header > span:nth-child(1) > ul > li:nth-child(3)");
  // const anchorEl = document.querySelector('a[name="magnitudes"] ~ div.grid_header');
  if (!anchorEl) {
    console.error('Cannot find UI container for B-V index. No-op.');
    return;
  }


  const bandMagMap = getBandMagnitudeMap();

  const absMagText = (() => {
    const distanceInPc = parseFloat(getDistance() || 0);
    if (distanceInPc > 0) {
      const magTESS  = bandMagMap['TESS'];
      const magAbsoluteTESS = magTESS - 5 * Math.log10(distanceInPc / 10);
      let text = `Abs. mag: TESS ${magAbsoluteTESS.toFixed(1)}`;

      const magV  = bandMagMap['V'];
      if (magV) {
        const magAbsoluteV = magV - 5 * Math.log10(distanceInPc / 10);
        text += `&nbsp; V ${magAbsoluteV.toFixed(1)}`;
      }
      return text;
    }
    return '';
  })();

  const vMagText = (() => {
    // V Mag useful to compare with SIMBAD, VSX, ASAS-SN
    let magV  = bandMagMap['V'];
    if (magV) {
      return `V mag: ${magV}`;
    }
    return '';
  })();

  const gaiaLikeMagText = (() => {
    // Gaia Mag useful to compare with Gaia DR3 output
    let magGaiaLike  = bandMagMap['Gaia'];  // peak at 673nm
    if (magGaiaLike) {
      return `Gaia mag: ${magGaiaLike}`;
    }

    magGaiaLike  = bandMagMap['r'];  // sloan r, peak at 623nm
    // don't use sloan g, which is closer to V (peak at 477nm)
    if (magGaiaLike) {
      return `r mag: ${magGaiaLike}`;
    }
    return '';
  })();

  const colorIndexHTML = (() => {
    const bvColorIndex = bandMagMap['B'] - bandMagMap['V'];
    const spectralType = (() => {
      if (isNaN(bvColorIndex)) {
        return '';
      }
      // The mapping is based on : https://en.wikipedia.org/wiki/Color_index
      const bvColorIndexToSpectral = [
        [-0.33, "> O"],
        [-0.30, "O"],  // i.e, < -0.30 is O type
        [-0.02, "B"],
        [0.30, "A"],
        [0.58, "F"],
        [0.81, "G"],
        [1.40, "K"],
        [Number.POSITIVE_INFINITY, "M"],
      ];
      for (const entry of bvColorIndexToSpectral) {
        if (bvColorIndex < entry[0]) {
          return entry[1];
        }
      }
    })();
    const bvColorIndexStr = isNaN(bvColorIndex) ? 'N/A': bvColorIndex.toFixed(2)
    // we return the <span> even if B-V is not available.
    // , because users can use use the color index link for information.
    return `
  <span title="B-V color index, and estimated spectral type.
  O5V: -0.33 ; B0V: -0.30 ; A0V: -0.02 ;
  F0V: 0.30 ; G0V: 0.58; K0V: 0.81; M0V: 1.40"
        style="padding: 0 1.5ch;">
      <a href="https://en.wikipedia.org/wiki/Color_index"
          target="_color_index" style="font-size: 1em; padding: 0.1em 0.5ch;">B-V:</a>
      ${bvColorIndexStr} (${spectralType})
  </span>`;
  })();

  // add the assembled HTML to the anchor
  // use a <div> so that they show in their own line (it's too long to append to existing one)
  document.getElementById('magExtraCtr')?.remove();  // remove existing DOM if any to support redo
  anchorEl.insertAdjacentHTML('beforeend', `<div id="magExtraCtr">
<span style="margin-left: 1ch;">${vMagText}</span>
<span style="margin-left: 1ch;">${gaiaLikeMagText}</span>
<span style="margin-left: 1ch;">${absMagText}</span>
${colorIndexHTML}
</div>`);

} // function tweakMag()
tweakMag();


//
// Highlight observation notes if any
//
(() => {
  const observationNoteCtr = document.querySelector(".overview_header0 a[href^='edit_obsnotes.php']");
  if (!observationNoteCtr) {
    console.warn("Observation Note highlight failed: cannot find the element.  No-Op.");
    return;
  }
  const countText = observationNoteCtr.querySelector('.count')?.textContent;
  if (countText != '0') {
    // blinking yellow was used in the past, but with the new UI,
    // yellow over blue background stands out pretty well without blinking.
    observationNoteCtr.querySelector('.fa-comments').style.color = "yellow";
  }
})();


// Highlight various elements
(() => {
  // Highlight the existence of TOI/CTOI
  let maxNumTOIorCTOIs = 0;
  ['#tois', '#ctois'].forEach( (anchor) => {
    const linkEl = document.querySelector(`.navbar0 a[href="${anchor}"]`);
    if (!linkEl) {
      console.warn(`Cannot find ${anchor} . Highlight no-op`);
      return;
    }

    const numItemsText = linkEl?.querySelector('span.super')?.textContent;
    if (numItemsText && numItemsText != '0') {
      linkEl.style.backgroundColor = 'rgba(255, 255, 0, 0.7)';
      linkEl.style.fontWeight = 'bold';
    }
    const numItems = parseInt(numItemsText, 10);
    if (numItems > maxNumTOIorCTOIs) {
      maxNumTOIorCTOIs = numItems;
    }
  });
  if (maxNumTOIorCTOIs > 0) { // if any TOI/CTOI, indicate it in title
    console.debug('tweak title');
    document.title = `(${maxNumTOIorCTOIs}) ExoFOP TIC ${getTic()}`;
  }


  // highlight the existence of stellar companion
  const numCompanions = parseInt(document.querySelector('a[href="#stellarcomp"] > span')?.textContent, 10)
  if (numCompanions > 0) {
    const companionAnchorEl = document.querySelector('a[href="#stellarcomp"]');
    companionAnchorEl.style.backgroundColor = 'rgba(255, 255, 0, 0.7)';
    companionAnchorEl.style.fontWeight = 'bold';
  }

  // mark false positive varieties for disposition

  function highlightIfFalseAlarm(elList) {
    let highlighted = false;
    elList.forEach(el => {
      // APC: ambiguous planetary candidate in TFOPWG
      // they are usually determined to be SB by SG1 RV observation.
      // For our purpose, I think we can treat it as if they are false positives
      if (el.textContent.match(/^(FA|FP|APC)/)) {
        el.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        highlighted = true;
      }
    });
    return highlighted;
  }

  // for TESS Disposition
  const elsTESSDisp =  Array.from(document.querySelectorAll('#myGrid1 .ag-center-cols-container > div > div:nth-of-type(11)'));
  const isTESSHighlighted = highlightIfFalseAlarm(elsTESSDisp);
  // for TFOPWG Disposition
  const elsTFOPWGDisp = Array.from(document.querySelectorAll('#myGrid1 .ag-center-cols-container > div > div:nth-of-type(12)'));
  const isTFOPWGHighlighted = highlightIfFalseAlarm(elsTFOPWGDisp);


  // copy disposition and notes to the header to avoid horizontal scrolling

  const strTESSDisp = elsTESSDisp.map(e => e.textContent.trim()).join(",");
  const strTFOPWGDisp = elsTFOPWGDisp.map(e => e.textContent.trim()).join(",");

  const strCombinedDisp = (strTESSDisp || strTFOPWGDisp) ? `${strTESSDisp} / ${strTFOPWGDisp}` : '';
  const styleExtras = (isTESSHighlighted || isTFOPWGHighlighted) ? "background-color: rgba(255, 0, 0, 0.8);" : "";

  // Notes:
  const elsNotes = Array.from(document.querySelectorAll('#myGrid1 .ag-center-cols-container > div > div:nth-of-type(17)'));
  const strNotes = elsNotes.map(e => e.textContent.trim()).join(" | ");

  // Put them in header
  // for Notes; add class "ag-cell-value" to the span so that
  // it can be copied by ctrl-double click (see initCopyCellTextOnDblClick() logic)
  document.querySelector('a[name="tois"] ~ div.grid_header')?.insertAdjacentHTML('beforeend', `
<span style="font-weight: normal; font-size: 85%; margin-left: 1ch; padding-left: 0.5ch; padding-right: 0.5ch; ${styleExtras}" title="TESS Disposition / TFOPWG Disposition">
  ${strCombinedDisp}
</span>
<span style="margin-left: 2ch; font-size: 70%; font-weight: normal;" class="ag-cell-value">${strNotes}</span>
`);

})();

(() => { // Highlight previous exoplanet mission targets
  if (getAliasesList().some(alias => alias.match(/EPIC|K2|Kepler|WASP/))) {
    const headerEl = document.querySelector('.overview_header > span:first-of-type > span.purple-text');
    headerEl?.insertAdjacentHTML('afterend', `<span style="background-color: yellow; padding: 1px 2ch;"> Kepler/K2 </span>`);
  }
})();


//
// Convert Epoch from BJD to BTJD , sector / relative time in planet parameters table
//
function showEpochInBTJDAndRelative() {
  const headerEl = document.querySelector('#myGrid3 div.ag-header-container > div > div:nth-of-type(2)  span[ref="eText"]')
  headerEl.textContent = 'Epoch (BTJD)'; // new header

  // actual conversion cell by cel
  const cellEpochs = document.querySelectorAll('#myGrid3 .ag-center-cols-container > div > div:nth-of-type(2)');
  cellEpochs.forEach(cellWrapperEl => {
    const cellTextEl = cellWrapperEl.querySelector('.ag-cell-value > div');
    if (!cellTextEl) {
      return;
    }
    if (cellTextEl.title?.startsWith('BJD ')) {
      // case conversion already done for the cell. No-op.
      // (for redoTweaks workflow)
      return;
    }
    const bjdStr = cellTextEl.textContent;
    const bjd = parseFloat(bjdStr); // some of the epoch has error margin, which would be ignored by the parseFloat
    if (bjd) {
      cellTextEl.title = `BJD ${bjdStr}`;
      cellTextEl.textContent = bjdToBtjdAndRelativeStr(bjd);
    }
  });
}
showEpochInBTJDAndRelative();


// Extract coordinate for ease of copy/paste
if (coord) {
  // The CSS selector used depends on if there is a TOI summary box preceding it.
  // The info is encoded in `coord.uiCtrIdx`
  const headerEl = document.querySelector(`.overview_header > span:nth-of-type(${coord.uiCtrIdx}) > span.purple-text`);
  headerEl.insertAdjacentHTML('afterend', '<button id="raDecCopyCtl" style="font-size: 80%; margin-left: 6px;">Copy</button>');
  document.getElementById('raDecCopyCtl').onclick = (evt) => {
    const raDecStr = `${coord.ra_deg} ${coord.dec_deg}`;
    GM_setClipboard(raDecStr);
    evt.target.textContent = 'Copied';
  }
}


function showMessageTemporarily(msg, durationInSec=5) {
  document.body.insertAdjacentHTML('beforeend', `
<div id="tempMsgPopIn" style="z-index: 9999; position: fixed; right: 10px; top: 20px; padding: 6px; max-width: 20vw; background-color: rgba(255, 255, 0, 0.7);">
${msg}
</div>
`);
  setTimeout(() => { document.getElementById('tempMsgPopIn')?.remove();  }, durationInSec* 1000);
} // function showMessageTemporarily()


// Helper to copy the text of a cell text to clipboard. Use cases
// 1. copy TOI Notes (long notes are trimmed)
// 2. smart copy of TOI with priority, to the form of #TOI 1234.01 (master priority 2)
function initCopyCellTextOnDblClick() {
  // console.debug('initCopyCellTextOnDblClick()...');
  function getTextToCopy(cellEl) {
    let text = cellEl?.textContent?.trim() || '';
    const titleText = cellEl?.title;
    if (titleText) {
      // copy titleText use case:
      // copy epoch in BJD (stored in title after our tweak above), in addition to BTJD
      text = `${text}  ${titleText}`;
    }
    if (!text.startsWith('TOI ')) {
      return text;
    }

    // special case for TOI,
    // First, add hash to TOI
    text = `#${text}`;

    // Then, try to get the master priority too.
    // the logic only works for the TOI cell in TOIs table
    // (it does not work for the one in CTOIs table or planet parameters table)
    const masterPriority = (() => {
      try {
        // traverse up to find the row number of the current cell
        const rowEl = cellEl.parentElement.parentElement.parentElement;
        const tableEl = rowEl.parentElement;
        const rowIdx = Array.from(tableEl.children).indexOf(rowEl);

        // The Priority (and others) are placed as in the adjacent table
        // logically on the same row identified by rowIdx
        return tableEl.nextElementSibling.querySelector(`div[row-index="${rowIdx}"] .ag-cell-value`).textContent
      } catch (err) {
        console.warn("copy TOI priority failed.", err);
        return null;
      }
    })();
    if (masterPriority) {
      text = `${text} (master priority ${masterPriority})`;
    }
    return text;
  }

  function copyCellTextOnDblClick(evt) {
    // console.debug('evt:', evt);
    if ( (evt.ctrlKey || evt.altKey || evt.shiftKey) &&
         (evt?.target?.classList?.contains('ag-cell-value') ||
          evt?.target?.parentElement?.classList?.contains('ag-cell-value')) ) {
          const text = getTextToCopy(evt.target);
          GM_setClipboard(text);
          showMessageTemporarily(`${text} copied to clipboard.`);
    }
  }

  document.addEventListener('dblclick', copyCellTextOnDblClick);
}
initCopyCellTextOnDblClick();


// Helper to copy the link to an section (with anchor)
function initCopySectionLinkOnDblClick() {
  function copySectionLinkOnDblClick(evt) {
    // console.debug('evt:', evt);
    if ( (evt.ctrlKey || evt.altKey || evt.shiftKey) &&
         evt.target?.classList?.contains('grid_header') ) {
          // case it's a section header
          // looks for <a name="...">
          const anchor = evt.target.previousElementSibling?.name;
          if (anchor) {
            // create new URL with the anchor,
            // replace existing anchor in the URL, if any
            const text = location.href.replace(/#.+$/, '') + `#${anchor}`;
            GM_setClipboard(text);
            showMessageTemporarily(`${text} copied to clipboard.`);
          }
    }
  }
  document.addEventListener('dblclick', copySectionLinkOnDblClick);
}
initCopySectionLinkOnDblClick();


function autoOpenLinks() {
  const[, targetsStr] = location.hash.match(/open=([^&]+)/) || [null, null];
  if (!targetsStr) {
    return;
  }

  targetsStr.split('|').forEach(target => {
    const linkEl = document.querySelector(`a[target="${target}"]`);
    if (linkEl) {
      GM_openInTab(linkEl.href, true); // in background
    } else {
      console.warn(`Cannot find Links to ${target} to be launched`);
    }
  });

  // reset the hash so that
  // if users reload (or reopen closed tab), the links won't be spawned again
  history.pushState("", document.title, location.pathname + location.search);
}


function setCanonicalURL() {
  // Change URL in forms such as "?id=Gaia DR3 ..."
  // to  the canonical one "?id=<tic_id>"

  if (location.search.match(/id=(\d)+/)) {
    // already in canonical form
    return;
  }

  const tic = getTic();
  if (!tic) {
    console.warn("setCanonicalURL(): No-op. Cannot get TIC");
    return;
  }

  history.pushState("", document.title, `${location.pathname}?id=${tic}`);
}


function autoOpenLinksAndSetCanonicalURL() {
  // the 2 functions are unrelated in terms of features
  // they are grouped together because they both
  // could change the current URL,
  // and should be invoked in the following order.
  autoOpenLinks();
  setCanonicalURL();
}


//
// For some of the tweaks, they don't really work unless ExoFOP page is in foreground
// when the codes are called.
// Provide a keyboard shortcut Alt-R to redo them
//
function redoTweaks() {
  addExternalLInks();
  tweakMag();
  showEpochInBTJDAndRelative();
}

// invoke redoTweaks() / autoOpenLinksAndSetCanonicalURL()
// depending on whether the tab is foreground/background
if (document.visibilityState === 'visible') {
  // case the tab is in foreground, we can apply the tweaks right
  // no need to call redoTweaks() for foreground
  autoOpenLinksAndSetCanonicalURL(); // depends on external links working
} else {
  // case the tab is in background. use case:  one switches to the ExoFOP tab
  // need to tweaks (that did not work in the background)
  window.addEventListener('focus', () => {
    setTimeout(() => {
      redoTweaks();
      autoOpenLinksAndSetCanonicalURL();
    }, 250);
  });
}

// let user press Alt-R as a last resort
document.addEventListener('keydown', function(evt) {
  if (evt.altKey && evt.code == 'KeyR') {
    evt.preventDefault();
    redoTweaks();
  }
});


// Abbreviate the empty tables so that stellar parameters / Magnitudes are visible
// without scrolling down for many cases.
// In the new UI, empty table abbreviation is less useful because the basic info takes up
// so much space so I'd need to scroll down anyway even if I abbreviate empty tables.
// Action: comment out the logic (that no longer works correctly anyway)
//
// function abbrevEmptyTables() {
//   GM_addStyle(`
// table.abbrev > tbody {
//   max-height: 12px;
//   display: block;
//   color: gray;
// }

// table.abbrev > tbody tr:nth-of-type(n+2) { /* show 1st row only */
//   display: none;
// }

// table.abbrev .myButt2 { /* buttons in header */
//   background-color: darkgray;
//   font-size: 8px;
// }

// table.abbrev .hsmall { /* header title */
//   font-size: 10px;
// }

// table.abbrev th { /* reduce padding given header is smaller */
//   padding-top: 4px;
//   padding-bottom: 4px;
// }

// table.abbrev + br { /* the table is followed by 2 <brs>, hide 1 of them */
//   display: none;
// }

// table.abbrev {  /* with <br> hidden, the vertical space is too tight. use margin to compensate */
//   margin-bottom: 6px;
// }

// `);

//   Array.from(document.querySelectorAll('a[name] + table'), (tab) => {
//     const numHeaderRows = ["tseries", "tois"].includes(tab.previousElementSibling.name)  ? 3 : 2;
//     if (tab.querySelectorAll('tbody tr').length <= numHeaderRows) {
//       // has headers only
//       tab.classList.add('abbrev');
//     }
//   });
// }
// abbrevEmptyTables();
