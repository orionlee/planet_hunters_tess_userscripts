// ==UserScript==
// @name         tess-lightcurves UI Tweak
// @namespace    astro.tess
// @version      1.0.0
// @description
// @author
// @match        https://tess-lightcurves.streamlit.app/~/+/?tic=*
//               ^^^ this matches the iframe of the actual plots
// @icon         https://tess-lightcurves.streamlit.app/-/build/favicon.ico
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  // Hide the specified list of plots by indices (1-based)
  // Use case: highlight variation over time by using a subset of sectors.
  function hidePlot(idxList) {
    document.documentElement.classList.add('hide-show');
    // :nth-of-type() is not useful, as .stPlotlyChart is not direct children of the container
    // :not(.hide): exclude those already hidden, matching what users see.
    const cssPath = `.stMainBlockContainer .stPlotlyChart:not(.hide)`;
    const plotCtrList = document.querySelectorAll(cssPath); // MUST be done before the hide-show
    for (const idx of idxList) {
      const ctr = plotCtrList[idx - 1];
      // note: ctr.querySelector('svg text.gtitle')?.textContent to get the plot title
      if (ctr) {
        ctr.classList.add('hide');
      } else {
        console.warn(
          `hidePlot() cannto find the plot container with 1-based index ${idx}. CSS Path: ${cssPath}`,
        );
      }
    }
  }

  function showAllPlots() {
    document
      .querySelectorAll('.stMainBlockContainer .stPlotlyChart.hide')
      .forEach((el) => el.classList.remove('hide'));
  }

  function showHidePlotUI() {
    const idxStr = prompt(
      'Specify the plot to hide (first one is 1, comma-separated)',
      '1',
    );
    const idxList = idxStr.split(',').map((iStr) => parseInt(iStr, 10));
    hidePlot(idxList);
  }

  function initHideShow() {
    GM_addStyle(`
.hide-show .hide {
    display:none;
}
`);

    GM_registerMenuCommand('Hide Plot...', showHidePlotUI);
    GM_registerMenuCommand('Reset (show all)', showAllPlots);
  }
  initHideShow();
})();
