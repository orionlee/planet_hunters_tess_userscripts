// ==UserScript==
// @name        Vizier Plot for Gaia DR3 Photometry Tweaks
// @namespace   astro.tess
// @match       https://cdsportal.u-strasbg.fr/widgets/dataplot/dataplot.html?*%3DI%2F355*
//              ^^^ the iframe of Gaia DR3 Photometry plot. Parent URL in the form of:
//                  https://cdsarc.cds.unistra.fr/vizier/vizgraph.gml?-s=I/355&-i=.graph_sql_epphot&*
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description
// @icon        https://cdsarc.cds.unistra.fr/favicon.ico
// ==/UserScript==



function plotGmagOnlyInScatter() {
  document.querySelector('input#option_dataset_lines_1').click();  // uncheck to show G as dots
  document.querySelector('input#option_dataset_serie_2').click();  // uncheck to hide BP
  document.querySelector('input#option_dataset_serie_3').click();  // uncheck to hide RP

  document.querySelector('input#graph_vizier_reset_zoom').click(); // reset zoom

}


function initUI() {
  document.querySelector('#gadget_share').insertAdjacentHTML('afterbegin', `
<button id="showGInDotsOnlyCtl">G scatter only</button>&nbsp;
`);
  document.getElementById('showGInDotsOnlyCtl').onclick = plotGmagOnlyInScatter;
}
setTimeout(initUI, 5000);  // a crude way to wait till photometry VOTable has been loaded

