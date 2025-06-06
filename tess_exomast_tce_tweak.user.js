// ==UserScript==
// @name        TESS - ExoMAST TCE tweak
// @namespace   astro.tess
// @match       https://exo.mast.stsci.edu/exomast_planet.html?planet=*
// @grant       none
// @noframes
// @version     1.1.14
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
    [82, 3533.392399975031, 3559.246006928212],
    [83, 3559.426559401176, 3584.374696290808],
    [84, 3584.592250617703, 3610.343692686968],
    [85, 3610.560214770112, 3636.050122901611],
    [86, 3636.2568238562, 3662.825996818895],
    [87, 3663.037114062155, 3689.9377885567224],
    [88, 3690.148437253382, 3717.923895063307],
    [89, 3718.134541804454, 3746.944481316125],
    [90, 3747.159028640203, 3775.077421082559],
  ]; // Note: update the one in tess_exofop_tweak.user.js too


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
  if (!/planet=TIC.+/.test(location.search)) {
    // the target is not a TESS target. changing to BTJD would not make sense
    return;
  }

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

// Sometimes the planet radius shown in TCE is calculated when the star size assumed to be 1 (star size unknown)
// So to mitigate it, we use the available data to create a rough estimate.
// If the rough estimate is off too much, we display it as a warning.
// Example - see:
//   https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/2112/1327057?comment=2557625
function warnIfPlanetRadiusMightBeOff() {
  const radiusStarInSun = parseFloat(document.querySelector('#Rs ~ span').firstChild.nodeValue)
  const transitDepthInPct = parseFloat(document.querySelector('#transit_depth ~ span').firstChild.nodeValue)
  const radiusPlanetInJupiter = parseFloat(document.querySelector('#Rp ~ span').firstChild.nodeValue)
  const estRadiusPlanetInJupiter = Math.sqrt(radiusStarInSun * radiusStarInSun * transitDepthInPct / 100) / 0.10276

  // if the radius reported vs estimated is off by more then 30%, warn the users
  if (Math.abs(radiusPlanetInJupiter - estRadiusPlanetInJupiter) / radiusPlanetInJupiter >= 0.3) {
    document.querySelector('#Rp ~ span').insertAdjacentHTML('afterend', `\
<span style="color: red;font-weight: bold;"
      title="The reported planet radius could be way off due to, e.g., assuming star size is sun. Shown is the estimate."
>(${estRadiusPlanetInJupiter.toFixed(3)})</span>`);
  }
}

// wait till Ajax load done
// setTimeout(showTransitTimeInBtjd, 4000);
const dataObserver = new MutationObserver(function(mutations, observer) {
  console.debug('TCE data on left panel loaded');
  showTransitTimeInBtjd();
  warnIfPlanetRadiusMightBeOff();
  observer.disconnect();
});
dataObserver.observe(document.querySelector('#data'), { childList: true });


// To access related links for the pdfs
// we must wait for Data Coverage tab loaded, which takes a while
// Here we alert the users (via tab title) that Data Coverage tab has been loaded.
let dataCoverageLoadDone = false;
function alertWhenDataCoverageLoadDone() {
  if (dataCoverageLoadDone) {
    return;
  }

  const stillLoading = (document.querySelector('.jquery-loading-modal__text')?.textContent === 'Loading exoplanet data...');
  if (stillLoading) {
    setTimeout(alertWhenDataCoverageLoadDone, 2000);
  } else {
    dataCoverageLoadDone = true;
    document.title = '✓' + document.title; // signify it's loaded with the tab title
  }
}
setTimeout(alertWhenDataCoverageLoadDone, 2000);
