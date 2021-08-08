// ==UserScript==
// @name        Vizier UI tweak
// @namespace   astro.tess
// @match       http://vizier.u-strasbg.fr/viz-bin/VizieR-S?*
// @noframes
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description
// @icon        http://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==

// For single targget page, in URL pattern
// http://vizier.u-strasbg.fr/viz-bin/VizieR-S?*
//
function addExternalLinks() {
  const id = location.search?.replace(/^[?]/, '');
  if (!id) {
    return;
  }

  document.querySelector('.cdsPageTitle h1').insertAdjacentHTML('afterend', `
<div id="extLinksCtr" style="
    text-align: center;
    font-size: 80%;
">
    <a href="http://simbad.u-strasbg.fr/simbad/sim-id?Ident=${id}">SIMBAD</a>&emsp;|&emsp;<a href="https://aladin.u-strasbg.fr/AladinLite/?target=${id}&fov=0.08">Aladin Lite</a>
</div>`);
  console.debug(document.getElementById('extLinksCtr'));
}
addExternalLinks();
