// ==UserScript==
// @name        Planet Hunters TESS Classifying the Classified Tweaks
// @namespace   astro.tess
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/classifying-the-classified*
// @grant       GM_openInTab
// @grant       GM_setClipboard
// @version     1.2.3
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/project_avatar/7a23bfaf-b1b6-4561-9156-1767264163fe.jpeg
// ==/UserScript==


function clickInfoBtn() {
  const infoBtn = document.querySelector('button[title="Metadata"]');
  if (infoBtn) {
    infoBtn.click();
    return true;
  }
  console.warn("Cannot find Info Button. No-Op;")

  return false;
} // function clickInfoBtn()


const keyMap = {
  "KeyI":    clickInfoBtn,
  "Numpad1": clickInfoBtn,
  "!altKey": {},
  "!any-modifier": {},
}


//
// The following generic code is copied from Planet Hunter TESS Tweaks userjs
//
function handleViewerKeyboardShortcuts(evt) {
  if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(evt.target.tagName)) {
    // user typing in an input box or focuses on a button, do nothing
    return;
  }

  const handler =(() => {
    const hasAnyModifier = evt.altKey || evt.shiftKey || evt.ctrlKey || evt.metaKey;
    if (!hasAnyModifier) {
      return keyMap[evt.code];
    }

    let res = null;
    if (evt.altKey && !evt.shiftKey && !evt.ctrlKey && !evt.metaKey) {
      res = keyMap['!altKey'][evt.code];
    }

    if (res == null) {
      res = keyMap['!any-modifier'][evt.code];
    }
    return res;
  })();

  if (handler) {
    const success = handler();
    if (success) {
      evt.preventDefault();
    }
  }

}
window.addEventListener('keydown', handleViewerKeyboardShortcuts);


//
// Ctrl Double Click TICID in Metadata Popin spawns ExoFOP page
//
function getMetaData(name) {
  let row = null;
  document.querySelectorAll('.modal-dialog table tbody > tr').forEach(tr => {
    if (tr.querySelector('th')?.textContent === name) {
      row = tr;
    }
  });
  return row?.querySelector('td')?.textContent;
}


function message(msg, showDurationMillis=3000) {
  document.body.insertAdjacentHTML('beforeend', `
<div id="msgCtr" style="position: fixed;right: 4px;bottom: 10vh;background-color: rgba(255, 255, 0, 0.6);z-index: 9999;">
${msg}
</div>
`);
  setTimeout(() => { document.getElementById('msgCtr')?.remove(); }, showDurationMillis);
}


function copySectorTicToClipboard(notifyUser=true) {
  const tic = getMetaData('TICID');
  const sector = getMetaData('thissector');
  const text = `${sector}, ${tic}`;
  GM_setClipboard(text);
  if (notifyUser) {
    message(`${text}<br>copied.`);
  }
  return text;
}


function onDblClickToSpawnExoFOP(evt) {
  if (!(evt.target.tagName === 'TD' && evt.target.previousElementSibling?.textContent === 'TICID')) {
    return;
  }

  // case on TICID cell
  if (!(evt.ctrlKey || evt.shiftKey || evt.altKey)) {
    copySectorTicToClipboard();
    return;
  }
  // case with Ctrl / shift / AltKey
  const tic = getMetaData('TICID');
  const exofopURL = `https://exofop.ipac.caltech.edu/tess/target.php?id=${tic}` +
    '#open=simbad|_vsx|_gaia-dr3-xmatch-var|_tce|_pht_talk|_gaia-dr3';
  GM_openInTab(exofopURL, true); // in background
  copySectorTicToClipboard();
}
document.addEventListener('dblclick', onDblClickToSpawnExoFOP);
