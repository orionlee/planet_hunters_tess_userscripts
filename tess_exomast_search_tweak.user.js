// ==UserScript==
// @name        TESS - ExoMAST search tweak
// @namespace   astro.tess
// @include     /^https:\/\/exo.mast.stsci.edu\//
// @grant       none
// @noframes
// @version     1.0.3
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==



function fillSearchBoxByHash() {
  if (location.pathname == '/' && location.hash.startsWith('#search=')) {
    const searchTerm = location.hash.replace('#search=', '');

    if (searchTerm) {
      const iBoxEl = document.querySelector('input#search');
      iBoxEl.value = decodeURIComponent(searchTerm);
      iBoxEl.focus();
      // TODO: emulate keyboard to press enter, to trigger ajax auto complete
    }
  }
} // function fillSearchBoxByHash()

fillSearchBoxByHash();

