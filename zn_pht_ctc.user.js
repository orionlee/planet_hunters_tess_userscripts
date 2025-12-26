// ==UserScript==
// @name        Planet Hunters TESS Classifying the Classified Tweaks
// @namespace   astro.tess
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/classifying-the-classified*
// @match       https://www.zooniverse.org/projects/sofia-dot-marie/classifying-the-classified-2025*
// @grant       GM_openInTab
// @grant       GM_setClipboard
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.4.3
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/project_avatar/7a23bfaf-b1b6-4561-9156-1767264163fe.jpeg
// ==/UserScript==



// BEGIN logic to log a subject being classified in CTC 2025
//

function my_GM_getValue(key, defaultValue="") {
  const result = GM_getValue(key);
  if (!result) {
    // Store a empty string so that the value can be edited in Tampermonkey UI
    GM_setValue(key, "");
    return defaultValue;
  }
  return result;
}


function toLogSubjectClassified() {
  return "true" == my_GM_getValue("logCTC2025SubjectClassified").toLowerCase()
}


function getSubjectIdFromTalkNDone() {
  function getSubjectUrl() {
    let subjectUrl = document.querySelector('.task-nav a')?.href;
    if (subjectUrl) {
      return subjectUrl;
    }
    // case Talk & Done has no URL yet (not enabled), enable it by selecting one of the option
    const oneAnswerEl = document.querySelector('.answers label.answer');
    oneAnswerEl.click();  // click one answer temporarily
    subjectUrl = document.querySelector('.task-nav a').href;
    setTimeout(() => oneAnswerEl.click(), 100);  // unclick it
    return subjectUrl;
  }

  // cache subjectId in `.task-nav` to minimize the need to accessing it Click&Done button,
  // as the access could scroll the page back up (if users has scrolled below the fold)
  let subjectId = document.querySelector('.task-nav').dataset['subjectId'];
  if (subjectId) {
    return subjectId;
  }

  [, subjectId] = getSubjectUrl()?.match(/subjects\/(\d+)/) || [null, null]

  document.querySelector('.task-nav').dataset['subjectId'] = subjectId;

  return subjectId;
}  // function getSubjectIdFromTalkNDone()


function createLogEntry() {
  // assumptions:
  // 1. In CTC 2025 classify page
  // 2. metadata pop-in is already shown

  const tic = getMetaData('tic');
  const sector = getMetaData('thissector');
  const [source, markedTransits] = (() => {
    if (getMetaData('RealTransit') == 'Transit-like events marked by volunteers') {
      return ["pht", getMetaData('MarkedTransits')];
    } else {
      return ["auto", "[]"];  // the markedTransits from algorithm are just dummy times
    }
  })();

  // done using the metadata pop-in. Now get subjectId

  const subjectId = getSubjectIdFromTalkNDone();

  const logEntry = [tic, sector, source, markedTransits];
  // console.debug(subjectId, logEntry);
  return [subjectId, logEntry];

}  // function createLogEntry()


function loadLogs() {
  return JSON.parse(localStorage['ctc2025SubjectLogs'] || '{}');
}


function saveLogs(logMap) {
  localStorage['ctc2025SubjectLogs'] = JSON.stringify(logMap);
}


let lastSubjectIdClassified = null;  // used by logSubjectClassified()
function logSubjectClassified() {
  // only log CTC 2025 subjects by volunteers, if enabled
  if (!toLogSubjectClassified()) {
    return;
  }
  if ('/projects/sofia-dot-marie/classifying-the-classified-2025/classify' != location.pathname) {
    return;
  }

  const [subjectId, logEntry] = createLogEntry();
  if (!subjectId) {
    console.error('logSubjectClassified() Cannot find subject ID. No-op');
    return;
  }

  if (subjectId == lastSubjectIdClassified) { // first check the cache
    console.debug('logSubjectClassified() already logged previously. No-op', subjectId);
    return;
  }

  const logMap = loadLogs();
  if (logMap[subjectId] != null) { // then check persistent storage
    console.debug('logSubjectClassified() already logged previously. No-op', subjectId);
    return;
  }

  logMap[subjectId] = logEntry;
  console.debug('logSubjectClassified() Saving log:', subjectId, logEntry);
  saveLogs(logMap);
  lastSubjectIdClassified = subjectId;
} // function logSubjectClassified()



function clickInfoBtnAndLog() {
  clickInfoBtn();
  logSubjectClassified();
}

/*
Sample 1-line code to dump all logged subjects to a semi colon-delimited string for future processing
Use semi-colon instead of comma to avoid the conflicts with column marked transits (comma separated). Semi-colon is one of the default options in Google Sheet.
res = 'subject;tic;sector;source;markedTransits\n'; for ([k,v] of Object.entries(JSON.parse(localStorage['ctc2025SubjectLogs']))) { res += `${k};${v.join(';')}\n`; }; console.log(res)
*/

//
// END   logic to log a subject being classified in CTC 2025


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
  "KeyI":    clickInfoBtnAndLog,  // clickInfoBtn,
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


function getMetaDataTIC() {
  let tic = getMetaData('TICID');  // old classifying-the-classified
  if (!tic) {
    tic = getMetaData('tic');  // new classifying-the-classified-2025
  }
  return tic;
}


function copySectorTicToClipboard(notifyUser=true) {
  const tic = getMetaDataTIC();
  const sector = getMetaData('thissector');
  const text = `${sector}, ${tic}`;
  GM_setClipboard(text);
  if (notifyUser) {
    message(`${text}<br>copied.`);
  }
  return text;
}


function onDblClickToSpawnExoFOP(evt) {
  if (!(evt.target.tagName === 'TD' && ['TICID', 'tic'].includes(evt.target.previousElementSibling?.textContent))) {
    return;
  }

  // case on TICID cell
  if (!(evt.ctrlKey || evt.shiftKey || evt.altKey)) {
    copySectorTicToClipboard();
    return;
  }
  // case with Ctrl / shift / AltKey
  const tic = getMetaDataTIC();
  const exofopURL = `https://exofop.ipac.caltech.edu/tess/target.php?id=${tic}` +
    '#open=simbad|_vsx|_gaia-dr3-xmatch-var|_tce|_pht_talk|_gaia-dr3';
  GM_openInTab(exofopURL, true); // in background
  copySectorTicToClipboard();
}
document.addEventListener('dblclick', onDblClickToSpawnExoFOP);
