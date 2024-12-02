// ==UserScript==
// @name        Vizier Plot for Gaia DR3 Photometry Tweaks - Outer Frame
// @namespace   astro.tess
// @match       https://cdsarc.cds.unistra.fr//vizier/vizgraph.gml?-s=I/355&-i=.graph_sql_epphot&*
//              ^^^ the top document of Gaia DR3 Photometry plot. The actual plot iframe's URL in the form of:
//                  https://cdsportal.u-strasbg.fr/widgets/dataplot/dataplot.html?*%3DI%2F355*
// @grant       GM_addStyle
// @version     1.0
// @author      -
// @description This script tweaks the outer frame of the plot. See tess_vizier_plot_gaiadr3_tweak.user.js for the inner iframe tweak.
// @icon        https://cdsarc.cds.unistra.fr/favicon.ico
// ==/UserScript==


//
// Make the outer window higher to have more vertical space.
// Use case: when an user tries to do a phase plot,
// the user can move the period pop-in below the plot.
//
// The implementation  cannot resize right away, because CDS javascript codes
// will do a resize to (700, 720).
// The following is a heuristics to ensure we do another resize after CDS codes are done.
//
function increaseWindowHeight() {
  // the iframe of the actual plot is dynamically created by CDS js codes.
  // we wait till the iframe is initialized with some plot content.
  const frameHeight = document.querySelector('#widget iframe')?.clientHeight;
  // console.debug(`increaseWindowHeight(): frameHeight=${frameHeight}`);
  if (!frameHeight || frameHeight < 100) {
    // console.debug(`increaseWindowHeight(): iframe not loaded yet. wait to resize`);
    setTimeout(increaseWindowHeight, 1000);
    return;
  }
  resizeTo(window.outerWidth, window.outerHeight + 200);
}
setTimeout(increaseWindowHeight, 2000);
