// ==UserScript==
// @name        eta-earth TESS Light Curve Explorer UI tweaks
// @namespace   astro.tess
// @match       https://eta-earth.org/tess_fits_play.html
// @noframes
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description
// @icon        https://eta-earth.org/favicon.ico
// ==/UserScript==


function roundNum(text, numDigits=2) {
  if (!text) {
    return '--';
  }
  return parseFloat(text).toFixed(numDigits);
}


function showStellarParams() {
  const _t = document.getElementById('headerDialogContent').textContent;
  if (!_t) {
    setTimeout(showStellarParams, 2000);
    return;
  }

  const rad = roundNum(_t.match(/RADIUS\s+=\s+([^/]*)/)[1])
  const teff = roundNum(_t.match(/TEFF\s+=\s+([^/]*)/)[1], 0)
  const tmag = roundNum(_t.match(/TESSMAG\s+=\s+([^/]*)/)[1])

  document.getElementById('plotOutput').insertAdjacentHTML('beforebegin',`
<div id="stellarParamsCtr">
  ${rad} R<sub>sun</sub> ; ${teff} K ; ${tmag} Tmag
</div>
`);
}
setTimeout(showStellarParams, 2000);
