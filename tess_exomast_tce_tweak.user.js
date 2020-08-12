// ==UserScript==
// @name        TESS - ExoMAST TCE tweak
// @namespace   astro.tess
// @include     /^https:\/\/exo.mast.stsci.edu\/exomast_planet.html[?]planet=.+/
// @grant       none
// @noframes
// @version     1.0.4
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

// Get BTJD 0 in regular date (Jan 07 2015)
// new Date(Date.UTC(1858, 11, 17) +  (2457000.0 - 2400000.5) * 86400 * 1000)

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
    const tBjtd = mjdToBtjd(parseFloat(timeEl.textContent));
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

