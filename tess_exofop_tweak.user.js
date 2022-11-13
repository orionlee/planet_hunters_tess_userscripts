// ==UserScript==
// @name        TESS - ExoFOP tweak
// @namespace   astro.tess
// @match       https://exofop.ipac.caltech.edu/tess/target.php?id=*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @noframes
// @version     1.24.5
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

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

function getTic() {
  const[, tic] = location.search.match(/id=(\d+)/) || [null, null];
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
  // distance: 17th column of the table of the stellar parameters table
  return (document.querySelector('#myGrid4 div.ag-center-cols-container > div:nth-of-type(1) > div:nth-of-type(17)') || { textContent: ''})
    .textContent;
} // function getDistance()

function getBandAndMagnitudeOfRow(rowIdx) {
  // - rowIdx 0 is first row, or div:nth-of-type(1)
  const rowEl = document.querySelector(`#myGrid6 div.ag-center-cols-container > div:nth-of-type(${1 + rowIdx})`);
  if (!rowEl) {
    return null;
  }
  return {
    band: rowEl.querySelector('div:nth-child(1)').textContent,
    magnitude: rowEl.querySelector('div:nth-child(2)').textContent,
  };
}

function getBandMagnitudeMap() {
  const rowEls = Array.from(document.querySelectorAll(`#myGrid6 div.ag-center-cols-container > div`));
  const res = {}  // band: magnitude map
  rowEls.forEach(rowEl => {
    res[rowEl.querySelector('div:nth-child(1)').textContent] =
      parseFloat(rowEl.querySelector('div:nth-child(2)').textContent);
  });
  return res;
}

function getOtherParams() {

  function getMagnitudeOfRow(rowIdx) {
    const ret = getBandAndMagnitudeOfRow(rowIdx);
    if (!ret) {
      return '';
    }
    return ret.band + '-' + ret.magnitude;
  }

  function getMagnitudes() {
    // try to get magnitudes in B and V bands, more likely to match SIMBAD data
    // - first row (row 0) is usually TESS band
    return getMagnitudeOfRow(1)
      + ', '
      + getMagnitudeOfRow(2);
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
  const raDecEl = document.querySelector('.overview_header > span:nth-of-type(2) > ul > li:nth-of-type(1)');
  const raDecMatch = raDecEl?.textContent?.match(/:\n([0-9:.]+)\s([0-9:.+-]+)\s+[(]([0-9.+-]+)°\s*([0-9.+-]+)°/);
  if (raDecMatch) {
    return {
             ra:      raDecMatch[1],
             dec:     raDecMatch[2],
             ra_deg:  raDecMatch[3],
             dec_deg: raDecMatch[4],
           };
  }
  console.warn('getCoord() - cannot find coordinate: ', raDecEl);
  return null;
}
const coord = getCoord();

const simbadLinkEl = document.querySelector('a[target="simbad"]');
if (simbadLinkEl) {
  // fix, fix simbad urls, with
  // for star with ra or dec between -1, and 1, the ExoFOP generated link
  // is in the form of ".../sim-coo?Coord=<ra>+-.665&Radius=2...", there is no "0" before the "."
  // SIMBAD, however, requires the 0 before the "."
  // for -1 < DEC < 1, e.g., -.123 => -0.123 ; .123 => 0.123
  simbadLinkEl.href = simbadLinkEl.href.replace(/(\d[+]-?)[.](\d)/, '$10.$2');
  // for -1 < RA < 1
  simbadLinkEl.href = simbadLinkEl.href.replace(/(Coord=-?)[.](\d)+/, '$10.$2');

  // add links to SIMBAD, VSX to the top

  const vsxUrl = 'https://www.aavso.org/vsx/index.php?view=search.top' +
    ((coord != null) ? `#coord=${encodeURIComponent(coord.ra + ' ' + coord.dec)}`  : '');

  const asasSnUrl = 'https://asas-sn.osu.edu/variables' +
    ((coord != null) ?
        `?ra=${encodeURIComponent(coord.ra)}&dec=${encodeURIComponent(coord.dec)}&radius=2` +
        '&vmag_min=&vmag_max=&amplitude_min=&amplitude_max=&period_min=&period_max=&lksl_min=&lksl_max=&class_prob_min=&class_prob_max=' +
        '&parallax_over_err_min=&parallax_over_err_max=&name=&references[]=I&references[]=II&references[]=III&references[]=IV&references[]=V&references[]=VI' +
        '&sort_by=distance&sort_order=asc&show_non_periodic=true&show_without_class=true&asassn_discov_only=false&'
        : '');

  // Gaia DR3 variables.
  // documentation: https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_variability_tables/
  const gaiaDr3VarUrl = 'https://vizier.u-strasbg.fr/viz-bin/VizieR-3?-source=I/358/vclassre' +
    ((coord != null) ? `#-c=${encodeURIComponent(coord.ra + ' ' + coord.dec)}`  : '');

  const tic = getTic();

  document.querySelector('a[href="/tess"]').insertAdjacentHTML('afterend', `\
<span style="background-color: #ccc; padding: 0.3em 2ch;">
  ${simbadLinkEl.outerHTML.replace('>\nSIMBAD<', ' accesskey="S"> SIMBAD<')} |
  <a href="${vsxUrl}" target="_vsx" accesskey="V" title="Variable Star Index">VSX</a> |
  <a href="${asasSnUrl}" target="_asas-sn" accesskey="A" title="All-Sky Automated Survey for Supernovae">ASAS-SN</a> |
  <a href="${gaiaDr3VarUrl}" target=_gaia-dr3-var" accesskey="G" title="Gaia DR3 Variables">GDR3 Var</a> |
  <a href="http://tessebs.villanova.edu/search_results?tic=${tic}" target="_tess-eb" accesskey="T">TESS-EB</a> |
  <a href="https://tev.mit.edu/data/search/?q=${tic}" target="_tev"
    title="To MIT TEV: it contains similar information; but it also has QLP validation reports when applicable">MIT TEV</a> |
  <a href="http://cdsportal.u-strasbg.fr/gadgets/ifr?url=http://cdsportal.unistra.fr/widgets/SED_plotter.xml&SED_plot_object=TIC${tic}&SED_plot_radius=5"
    target="_sed" title="Spectral Energy Distributions Plot">SED</a>  |
  <svg class="svg-inline--fa fa-external-link-alt fa-w-18" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
</span>`);
// ^^^ Note: the SED link passes TIC id without space `&SED_plot_object=TIC${tic}` deliberately
//           because the SED site's redirection seemed to mishandle spaces.
//           Having a space in the TIC would end up with an invalid URL.

  // Add aliases to all external catalog links
  const hashToAdd = `#aliases=${getAliasesList()}&other_params=${getOtherParams()}`;
  Array.from(document.querySelectorAll('a[target="simbad"], a[target="_vsx"], a[target="_asas-sn"]'),
    (a) => a.href += hashToAdd);

} else {
  console.warn('Cannot find Links to SIMBAD');
}

// Show absolute magnitude and B-V index (for spectral type estimation)
(() => {
  const anchorEl = document.querySelector('a[name="magnitudes"] ~ div.grid_header'); // where the output is added too
  if (!anchorEl) {
    console.error('Cannot find UI container for B-V index. No-op.');
    return;
  }

  const distanceInPc = parseFloat(getDistance() || 0);
  const bandAndMag = getBandAndMagnitudeOfRow(0);
  if (distanceInPc > 0) {
    const magApparent = parseFloat(bandAndMag.magnitude || 0);
    const magAbsolute = magApparent - 5 * Math.log10(distanceInPc / 10);
    anchorEl.insertAdjacentHTML('beforeend',
      `<span style="padding: 0 1.5ch;background-color: white;font-size: 90%; font-weight: normal;"
             >Abs. Mag: ${bandAndMag.band}  ${magAbsolute.toFixed(3)}</span>`);
  }

  const bandMagMap = getBandMagnitudeMap();
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
  anchorEl.insertAdjacentHTML('beforeend',`
<span title="B-V color index, and estimated spectral type.
O5V: -0.33 ; B0V: -0.30 ; A0V: -0.02 ;
F0V: 0.30 ; G0V: 0.58; K0V: 0.81; M0V: 1.40"
      style="padding: 0 1.5ch;background-color: #ddd; font-size: 90%; font-weight: normal;">
    <a href="https://en.wikipedia.org/wiki/Color_index"
        target="_color_index" style="font-size: 1em; padding: 0.1em 0.5ch;">B-V:</a>
    ${bvColorIndexStr} (${spectralType})
</span>`);

})();

//
// Highlight observation notes if any
//
const observationNoteBtn = document.querySelector('button.commentsbtn');
if (observationNoteBtn && observationNoteBtn.textContent.trim() !== 'Open Observing Notes (0)') {
  GM_addStyle(`
@keyframes blink-color {
  from {
    color: white;
    margin-left: 5px;
  }
  to {
    color: yellow;
    margin-left: 0px;
  }
}

.blinked {
  animation-name: blink-color;
  animation-duration: 1s;
  animation-iteration-count: 5;
  animation-play-state: paused; /* start only when the tab is visible */
  font-weight: bold;
  color: yellow;
}
`);
  observationNoteBtn.classList.add('blinked');

  // start blink animation only when the tab is visible
  const startAnimate = () => {
    if (!document.hidden) {
      observationNoteBtn.style.animationPlayState = 'running';
    }
  };
  document.addEventListener("visibilitychange", startAnimate, false);
} // if (observationNoteBtn ...

// Highlight various elements
(() => {
  // TODO: highlight TOI/CTOI table logic needs to be updated with the base UI changes
  // (possibly not too useful in the updated base UI)
//   GM_addStyle(`\
// table.highlighted tr:nth-of-type(1) th {
//     background-color: rgba(255, 255, 0, 0.7);
// }`);

//   const numHeaderRowsTOIs = 3;
//   const numHeaderRowsCTOIs = 2;
//   function highlightSectionTableIfNonEmpty(anchorName, numHeaderRows) {
//     const numTrs = document.querySelectorAll(`a[name="${anchorName}"] + table tr`).length;
//     if (numTrs > numHeaderRows) {
//       document.querySelector(`a[name="${anchorName}"] + table`).classList.add('highlighted');
//     } else if (numTrs < 1) {
//       console.warn('highlightSectionTableIfNonEmpty() no Rows founds, CSS path to the table possibly outdated. anchor:', anchorName);
//     }
//   }

//   highlightSectionTableIfNonEmpty('tois', numHeaderRowsTOIs);
//   highlightSectionTableIfNonEmpty('ctois', numHeaderRowsCTOIs);


  // mark false positive varieties for disposition

  function highlightIfFalseAlarm(elList) {
    elList.forEach(el => {
      if (el.textContent.match(/^(FA|FP)/)) {
        el.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      }
    });
  }

  // for TESS Disposition
  highlightIfFalseAlarm(document.querySelectorAll('#myGrid1 .ag-center-cols-container > div > div:nth-of-type(10)'));
  // for TFOPWG Disposition
  highlightIfFalseAlarm(document.querySelectorAll('#myGrid1 .ag-center-cols-container > div > div:nth-of-type(11)'));

})();

(() => { // Highlight previous exoplanet mission targets
  if (getAliasesList().some(alias => alias.match(/EPIC|K2|Kepler|WASP/))) {
    const headerEl = document.querySelector('.overview_header > span:first-of-type > span.purple-text');
    headerEl?.insertAdjacentHTML('afterend', `<span style="background-color: yellow; padding: 1px 2ch;"> Kepler/K2 </span>`);
  }
})();


// Convert Epoch from BJD to BTJD , sector / relative time in planet parameters table
function showEpochInBTJDAndRelative() {
  const cellEpochs = document.querySelectorAll('#myGrid3 .ag-center-cols-container > div > div:nth-of-type(2)');
  cellEpochs.forEach(cellWrapperEl => {
    const cellValueEl = cellWrapperEl.querySelector('.ag-cell-value > div');
    const bjdStr = cellValueEl.textContent;
    const bjd = parseFloat(bjdStr); // some of the epoch has error margin, which would be ignored by the parseFloat
    if (bjd) {
      cellValueEl.title = `BJD ${bjdStr}`;
      cellValueEl.textContent = bjdToBtjdAndRelativeStr(bjd);
    }
  });

  document.querySelector('#myGrid3 div.ag-header-container > div > div:nth-of-type(2)  span[ref="eText"]').textContent = 'Epoch (BTJD)';
}
showEpochInBTJDAndRelative();

// Extract coordinate for ease of copy/paste
if (coord) {
  const headerEl = document.querySelector('.overview_header > span:nth-of-type(2) > span.purple-text');
  headerEl.insertAdjacentHTML('afterend', '<button id="raDecCopyCtl" style="font-size: 80%; margin-left: 6px;">Copy</button>');
  document.getElementById('raDecCopyCtl').onclick = (evt) => {
    const raDecStr = `${coord.ra_deg} ${coord.dec_deg}`;
    GM_setClipboard(raDecStr);
    evt.target.textContent = 'Copied';
  }
}

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
