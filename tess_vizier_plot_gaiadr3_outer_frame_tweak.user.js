// ==UserScript==
// @name        Vizier Plot for Gaia DR3 Photometry Tweaks - Outer Frame
// @namespace   astro.tess
// @match       https://cdsarc.cds.unistra.fr//vizier/vizgraph.gml?-s=I/355&-i=.graph_sql_epphot&*
//              ^^^ the top document of Gaia DR3 Photometry plot. The actual plot iframe's URL in the form of:
//                  https://cdsportal.u-strasbg.fr/widgets/dataplot/dataplot.html?*%3DI%2F355*
// @grant       GM_addStyle
// @version     1.0.1
// @author      -
// @description This script tweaks the outer frame of the plot. See tess_vizier_plot_gaiadr3_tweak.user.js for the inner iframe tweak.
// @icon        https://cdsarc.cds.unistra.fr/favicon.ico
// ==/UserScript==


//
// Make the outer window higher to have more vertical space.
// Use case: when an user tries to do a phase plot,
// the user can move the period pop-in below the plot.
//
function increaseWindowHeight() {
  resizeTo(window.outerWidth, window.outerHeight + 200);
}
// We cannot resize right away, because CDS javascript codes
// will do a resize to (700, 720).
// So we wait to let CDS codes finish its work.
setTimeout(increaseWindowHeight, 2000);
