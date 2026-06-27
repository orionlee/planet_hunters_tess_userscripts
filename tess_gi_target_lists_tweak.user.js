// ==UserScript==
// @name         TESS GI Target List CSV UI tweaks
// @namespace    astro.tess
// @version      1.2.0
// @description
// @author
// @match        https://heasarc.gsfc.nasa.gov/docs/tess/data/target_lists/*.csv
// @icon         https://heasarc.gsfc.nasa.gov/docs/tess/images/logos/favicon.png
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Note: browsers by default download the csv files.
  // Need to use extension such as ModHeader to force browsers to render them as plain text
  function addLinksToGIProposals() {
    document.head.insertAdjacentHTML(
      'beforeend',
      `
<style>
  a {
    padding: 0 1ch;
  }
  pre {
    line-height: 1.4;
  }
</style>
`,
    );

    document.querySelector('pre').innerHTML = document
      .querySelector('pre')
      .innerHTML.replaceAll(
        /(G\d+)/g,
        '<a href="https://heasarc.gsfc.nasa.gov/docs/tess/approved-programs.html#search=$1">$1</a>',
      );
  }
  addLinksToGIProposals();

  // To make the browser tab easier to be identified.
  function tweakTitle() {
    const [filename] = location.pathname.match(/[^/]+$/) || [null];
    if (!filename) {
      return null;
    }
    const title = `TESS ${filename}`;
    document.title = title;
    return title;
  }
  tweakTitle();
})();
