// ==UserScript==
// @name        TESS - ExoMAST TCE tweak
// @namespace   astro.tess
// @include     /^https:\/\/exo.mast.stsci.edu\/exomast_planet.html[?]planet=.+/
// @grant       none
// @noframes
// @version     1.0.2
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

// Get BTJD 0 in regular date (Jan 07 2015)
// new Date(Date.UTC(1858, 11, 17) +  (2457000.0 - 2400000.5) * 86400 * 1000)

function bjtdToRelative(tBjtd) {
  // list of [sector, start in bjtd, stop in bjtd]
  const sectorStartStopList = [
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
];


  for (const row of sectorStartStopList) {
    if (row[1] <= tBjtd && tBjtd <= row[2]) {
      return [row[0], tBjtd - row[1]];
    }
  }
  // not found
  return [null, null];
} // function bjtdToRelative(..)

function mjdToBtjd(mjd) {
  return mjd + 2400000.5 - 2457000.0;
} // function mjdToBtjd()

function showTransitTimeInBtjd() {
  const unitEl = document.querySelector('#transit_time > .small-unit');
  if (unitEl && unitEl.textContent === '[MJD]') {
    const timeEl = document.querySelector('#transit_time ~ span');
    const tBjtd = mjdToBtjd(parseInt(timeEl.textContent, 10));
    timeEl.textContent = tBjtd
    unitEl.textContent = '[BTJD]';
    const [sector, timeRel] = bjtdToRelative(tBjtd);
    if (sector) {
      timeEl.insertAdjacentHTML('afterend', `<span class="nowrap" style="font-family: monospace; font-size: 90%">(${timeRel.toFixed(3)}, Sec. ${sector})</span>`);
    }
  } else {
    console.warn('Cannot found transit time in MJD', unitEl);
  }

} // function showTransitTimeInBtjd()

// wait till Ajax load done
// setTimeout(showTransitTimeInBtjd, 4000);
const dataObserver = new MutationObserver(function(mutations, observer) {
  console.debug('TCE data on left panel loaded');
  showTransitTimeInBtjd();
  observer.disconnect();
});
dataObserver.observe(document.querySelector('#data'), { childList: true });

