// ==UserScript==
// @name        TESS - Aladin Lite tweak
// @namespace   astro.tess
// @match       https://aladin.u-strasbg.fr/AladinLite/*
// @noframes
// @grant       GM_addStyle
// @version     1.0.2
// @author      -
// @description
// ==/UserScript==


function getObjectDetailTable() {
  return document.querySelector('table.object-details-table');
}

function tweakObjectDetailTable() {
  const tab = getObjectDetailTable();
  if (!tab) {
    console.error("tweakObjectDetailTable(): cannot locate the table. No-op");
    return;
  }

  // copy a preferred magnitude row to the top
  const magRowTdToCopy = Array.from(tab.querySelectorAll('tr > td:nth-of-type(1)')).find(td => {
    const preferredMagList = [
      'phot_g_mean_mag',  // for GAIA object
      'V', // for SIMBAD object
      'Jmag', // for 2MASS object
      ];
    return preferredMagList.includes(td.textContent);
  });

  if (!magRowTdToCopy) {
    console.warn('tweakObjectDetailTable(): cannot locate a preferred magnitude row. No-op');
    return;
  }

  const trToCopy = magRowTdToCopy.parentElement;
  // trToCopy.parentElement.insertAdjacentElement('afterbegin', trToCopy.cloneNode(true));
  const magType = trToCopy.querySelector('td:nth-of-type(1)').textContent;
  const magValue = trToCopy.querySelector('td:nth-of-type(2)').textContent;

  const targetCtr = getObjectDetailTable().parentElement;
  let summaryCtr = targetCtr.querySelector('#objSummary');
  if (!summaryCtr) {
    targetCtr.insertAdjacentHTML('afterbegin', `<div id="objSummary" style="font-size: 12px; font-style: italic;"></div>`);
    summaryCtr = targetCtr.querySelector('#objSummary');
  }
  summaryCtr.innerHTML = `${magType}:&emsp;&emsp;${magValue}`;

  return true;
}

function tweakObjectDetailTableOnChange() {
  // first tweak the existing table
  tweakObjectDetailTable();

  // Now setup the observer so that when the user clicks on a new star
  // the tweak will be applied again to the new content

  // the ancestor div.aladin-box that stays the same when user clicks on a new star
  const ctrToObserve = getObjectDetailTable()?.parentElement?.parentElement;

  if (!ctrToObserve) {
    console.error('tweakObjectDetailTableOnChange() - cannot find the UI container to setup the observer. No-op');
    return;
  }

  const observer = new MutationObserver((mutations, observer) => {
    // console.debug("mutation caught:", mutations);
    // console.debug("container:", ctrToObserve);

    // case user clicks on a new target, we apply the tweak on the new content
    // need to temporarily stop the observer to be on the safe side,
    // as the code is going to update the box's content the observer is observing.
    if (getObjectDetailTable() == null) {
      // edge case the user clicks to empty space, the table is removed;
      // nothing to tweak
      return;
    }

    observer.disconnect();
    try {
      tweakObjectDetailTable();
    } finally {
      observer.observe(ctrToObserve, { childList: true, subtree: false });
    }
  });

  observer.observe(ctrToObserve, { childList: true, subtree: false });
}

function initTweakObjectDetailTableUI() {
  // hack to place the control at the existing SIMBAD control, as it is the closest
  // to the object detail table.
  // the SIMBAD control takes a while to render, so the function needs to be executed
  // by a timeout
  function doInitTweakObjectDetailTableUI() {
    const uiCtr = document.querySelector('div.aladin-simbadPointerControl-container');  // div.title
    if (!uiCtr) {
      console.error('initTweakObjectDetailTableUI(); cannot find the anchor element to create UI. No-op');
      return;
    }
    uiCtr.insertAdjacentHTML('beforeend', `
  <button id="tweakObjectDetailTableCtl" title="Show the selected object's magnitude as the first row in the table"
          style="font-size: 12px;border-radius: 15%;max-width: 35px;margin-top: 6px;padding: 2px;"
          >Obj. mag.</button>
    `);
    document.getElementById('tweakObjectDetailTableCtl').onclick = tweakObjectDetailTableOnChange;
  }
  setTimeout(doInitTweakObjectDetailTableUI, 1500);
}
initTweakObjectDetailTableUI();


