// ==UserScript==
// @name        TESS - ExoFOP tweak
// @namespace   astro.tess
// @match       https://exofop.ipac.caltech.edu/tess/target.php?id=*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @noframes
// @version     1.5.0
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
];


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

//
// Generate modified SIMBAD URLs to pass along TIC's identifiers, etc.
// to aid in checking the result from SIMBAD link refers to the same object or not.
// (The SIMBAD link is coordinate-based, so at times it might be off target if there are nearby stars.)
//
function getAliases() {
  return document.querySelector('a[name="basic"] ~ table tr:last-of-type td:first-of-type').textContent;
}

function getDistance() {
  return (document.querySelector('a[name="stellar"] ~ table tr:nth-child(4) > td:nth-child(17)') || { textContent: ''})
    .textContent;
} // function getDistance()

function getBandAndMagnitudeOfRow(rowIdx) {
  // - rows 1 and 2 are headers, so rowIdx: 0 should be row 3
  const trEl = document.querySelector(`a[name="magnitudes"] ~ table tr:nth-child(${3 + rowIdx})`);
  if (!trEl) {
    return null;
  }
  return {
    band: trEl.querySelector('td:nth-child(1)').textContent,
    magnitude: trEl.querySelector('td:nth-child(2)').textContent,
  };
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

  return `Distance(pc): ${getDistance()} ; Magnitudes: ${getMagnitudes()} ;`;
} // function getOtherParams()


function getCoord() {
  const raDecEl = document.querySelector('a[name="basic"] ~table tbody tr:nth-of-type(3) td:nth-of-type(3)');
  const raDecMatch = raDecEl ? raDecEl.textContent.match(/([0-9:.]+)\s([0-9:.+-]+)[.\n\r]+([0-9.+-]+)°\s+([0-9.+-]+)°/) : null;
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

  document.querySelector('a[href="/tess"]').insertAdjacentHTML('afterend', `\
<span style="background-color: #ccc; padding: 0.3em 2ch;">
  ${simbadLinkEl.outerHTML} |
  <a href="${vsxUrl}" target="_vsx" title="Variable Star Index">VSX</a> |
  <a href="${asasSnUrl}" target="_asas-sn" title="All-Sky Automated Survey for Supernovae">ASAS-SN</a> |
  <svg class="svg-inline--fa fa-external-link-alt fa-w-18" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
</span>`);

  // Add aliases to simbad links
  Array.from(document.querySelectorAll('a[target="simbad"]'), (a) => a.href += `#aliases=${getAliases()}&other_params=${getOtherParams()}`);

} else {
  console.warn('Cannot find Links to SIMBAD');
}

// Show absolute magnitude
(() => {
  const distanceInPc = parseFloat(getDistance() || 0);
  const bandAndMag = getBandAndMagnitudeOfRow(0);
  if (distanceInPc > 0) {
    const magApparent = parseFloat(bandAndMag.magnitude || 0);
    const magAbsolute = magApparent - 5 * Math.log10(distanceInPc / 10);
    document.querySelector('a[name="magnitudes"] + table th').insertAdjacentHTML('beforeend',
      `<span style="padding: 0 2ch;background-color: white;font-size: 110%;"
             >Abs. Magnitude: ${bandAndMag.band}  ${magAbsolute.toFixed(3)}</span>`);
  }
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
}

// Highlight TOI / CTOI tables if there are entries.
(() => {
  GM_addStyle(`\
table.highlighted tr:nth-of-type(1) th {
    background-color: rgba(255, 255, 0, 0.7);
}`);

  function highlightSectionTableIfNonEmpty(anchorName, numHeaderRows) {
    const numTrs = document.querySelectorAll(`a[name="${anchorName}"] + table tr`).length;
    if (numTrs > numHeaderRows) {
      document.querySelector(`a[name="${anchorName}"] + table`).classList.add('highlighted');
    } else if (numTrs < 1) {
      console.warn('highlightSectionTableIfNonEmpty() no Rows founds, CSS path to the table possibly outdated. anchor:', anchorName);
    }
  }

  highlightSectionTableIfNonEmpty('tois', 3);
  highlightSectionTableIfNonEmpty('ctois', 2);


  // mark false positive varieties for disposition

  function highlightIfFalseAlarm(el) {
    if (el.textContent.match(/^(FA|FP)/)) {
      el.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    }
  }

  highlightIfFalseAlarm(document.querySelector('a[name="tois"] + table tr td:nth-of-type(11)'));
  highlightIfFalseAlarm(document.querySelector('a[name="tois"] + table tr td:nth-of-type(12)'));

})();

// Convert Epoch from BJD to BTJD , sector / relative time in planet parameters table
function showEpochInBTJDAndRelative() {
  const tdEpochs = document.querySelectorAll('a[name="planets"] + table tr > td:nth-of-type(4)');
  tdEpochs.forEach(td => {
    const bjdStr = td.textContent;
    const bjd = parseFloat(bjdStr); // some of the epoch has error margin, which would be ignored by the parseFloat
    if (bjd) {
      td.title = `BJD ${bjdStr}`;
      td.textContent = bjdToBtjdAndRelativeStr(bjd);
    }
  });

  document.querySelector('a[name="planets"] + table tr th:nth-of-type(4) div.error').textContent = 'BTJD';
}
showEpochInBTJDAndRelative();

// Extract coordinate for ease of copy/paste
if (coord) {
  // put the copy button at the header, (reducing the need of horizontal scrolling)
  const headerEl = document.querySelector('a[name="basic"] ~table tbody tr:nth-of-type(2) th:nth-of-type(3)');
  headerEl.insertAdjacentHTML('beforeend', '<br><button id="raDecCopyCtl" style="font-size: 80%;">Copy</button>');
  document.getElementById('raDecCopyCtl').onclick = (evt) => {
    const raDecStr = `${coord.ra_deg} ${coord.dec_deg}`;
    GM_setClipboard(raDecStr);
    evt.target.textContent = 'Copied';
  }
}
