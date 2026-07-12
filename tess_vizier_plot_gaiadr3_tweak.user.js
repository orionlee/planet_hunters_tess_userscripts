// ==UserScript==
// @name        Vizier Plot for Gaia DR3 Photometry Tweaks
// @namespace   astro.tess
// @match       https://cdsportal.u-strasbg.fr/widgets/dataplot/dataplot.html?*%3DI%2F355*
//              ^^^ the iframe of Gaia DR3 Photometry plot. Parent URL in the form of:
//                  https://cdsarc.cds.unistra.fr/vizier/vizgraph.gml?-s=I/355&-i=.graph_sql_epphot&*
// @grant       GM_addStyle
// @version     1.2.1
// @author      -
// @description This script tweaks the inner iframe of the plot. See tess_vizier_plot_gaiadr3_outer_frame_tweak.user.js for the outer frame tweak.
// @icon        https://cdsarc.cds.unistra.fr/favicon.ico
// ==/UserScript==

function changePeriod(factor) {
  const perEl = document.querySelector('input#option_axis_x_period');
  const curPer = parseFloat(perEl?.value);
  if (!curPer) {
    console.warn('changePeriod(): no current value. No-op');
    return;
  }
  perEl.value = curPer * factor;
}

function addPeriodControlsUI(retry=3, retry_delay=500) {
  const perEl = document.querySelector('input#option_axis_x_period');
  if (!perEl) {
    if (retry <=1) {
      console.warn(
        'addPeriodControls(): Cannot find period input element. No-op',
      );
    } else {
      setTimeout(() => { addPeriodControlsUI(retry--) }, retry_delay * 2);
    }
    return;
  }

  perEl.insertAdjacentHTML(
    'afterend',
    `
&nbsp;<button id="perHalfCtl">1/2 P</button>&nbsp;<button id="perDoubleCtl">2x P</button>
`,
  );
  document.getElementById('perHalfCtl').onclick = () => {
    changePeriod(0.5);
  };
  document.getElementById('perDoubleCtl').onclick = () => {
    changePeriod(2);
  };
}

function plotGmagOnlyInScatter() {
  document.querySelector('input#option_dataset_lines_1').click(); // uncheck to show G as dots
  document.querySelector('input#option_dataset_serie_2').click(); // uncheck to hide BP
  document.querySelector('input#option_dataset_serie_3').click(); // uncheck to hide RP

  document.querySelector('input#graph_vizier_reset_zoom').click(); // reset zoom
}

function createTSVDownloadUrl() {
  const urlDecoded = decodeURIComponent(location.href);
  const [pPos] = urlDecoded.match(/&Pos=[^&]+/) || [null]; // e.g., &Pos=244.27894496194-59.75065147156
  const [pSource] = urlDecoded.match(/&Source=[^&]+/) || [null]; // e.g., &Source=5831536483793346816

  return `https://cdsarc.cds.unistra.fr/viz-bin/vizgraph?-s=I%2F355&-i=.graph_sql_epphot${pPos}${pSource}&--output=tsv`;
}

function initUI() {
  addPeriodControlsUI();

  document.querySelector('#gadget_share').insertAdjacentHTML(
    'afterbegin',
    `
<a href="${createTSVDownloadUrl()}" target="_blank">TSV</a>&nbsp;&nbsp;
<button id="showGInDotsOnlyCtl">G scatter only</button>&nbsp;
`,
  );
  document.getElementById('showGInDotsOnlyCtl').onclick = plotGmagOnlyInScatter;
}
setTimeout(initUI, 5000); // a crude way to wait till photometry VOTable has been loaded
