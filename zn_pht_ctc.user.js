// ==UserScript==
// @name        Planet Hunters TESS Classifying the Classified Tweaks
// @namespace   astro.tess
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/classifying-the-classified*
// @match       https://www.zooniverse.org/projects/sofia-dot-marie/classifying-the-classified-2025*
// @grant       GM_openInTab
// @grant       GM_setClipboard
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @version     1.9.0
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/project_avatar/7a23bfaf-b1b6-4561-9156-1767264163fe.jpeg
// ==/UserScript==

// BEGIN logic to log a subject being classified in CTC 2025
//

function my_GM_getValue(key, defaultValue = '') {
  const result = GM_getValue(key);
  if (!result) {
    // Store a empty string so that the value can be edited in Tampermonkey UI
    GM_setValue(key, '');
    return defaultValue;
  }
  return result;
}

function toLogSubjectClassified() {
  return 'true' == my_GM_getValue('logCTC2025SubjectClassified').toLowerCase();
}

function getSubjectIdFromTalkNDone() {
  function getSubjectUrl() {
    let subjectUrl = document.querySelector('.task-nav a')?.href;
    if (subjectUrl) {
      return subjectUrl;
    }
    // case Talk & Done has no URL yet (not enabled), enable it by selecting one of the option
    const oneAnswerEl = document.querySelector('.answers label.answer');
    oneAnswerEl.click(); // click one answer temporarily
    subjectUrl = document.querySelector('.task-nav a').href;
    setTimeout(() => oneAnswerEl.click(), 100); // unclick it
    return subjectUrl;
  }

  const [, subjectId] = getSubjectUrl()?.match(/subjects\/(\d+)/) || [
    null,
    null,
  ];

  return subjectId;
} // function getSubjectIdFromTalkNDone()

function createLogEntry() {
  // assumptions:
  // 1. In CTC 2025 classify page
  // 2. metadata pop-in is already shown

  const tic = getMetaDataTIC();
  const sector = getMetaData('thissector');
  const [source, markedTransits] = getMetaDataSourceAndMarkedTransits();

  // done using the metadata pop-in. Now get subjectId

  const subjectId = getSubjectIdFromTalkNDone();

  const logEntry = [tic, sector, source, markedTransits];
  // console.debug(subjectId, logEntry);
  return [subjectId, logEntry];
} // function createLogEntry()

function loadLogs() {
  return JSON.parse(localStorage['ctc2025SubjectLogs'] || '{}');
}

function saveLogs(logMap) {
  localStorage['ctc2025SubjectLogs'] = JSON.stringify(logMap);
}

let lastSubjectIdClassified = null; // used by logSubjectClassified()
function logSubjectClassified() {
  // only log CTC 2025 subjects by volunteers, if enabled
  if (!toLogSubjectClassified()) {
    return;
  }
  if (
    '/projects/sofia-dot-marie/classifying-the-classified-2025/classify' !=
    location.pathname
  ) {
    return;
  }

  const [subjectId, logEntry] = createLogEntry();
  if (!subjectId) {
    console.error('logSubjectClassified() Cannot find subject ID. No-op');
    return;
  }

  if (subjectId == lastSubjectIdClassified) {
    // first check the cache
    console.debug(
      'logSubjectClassified() already logged previously. No-op',
      subjectId,
    );
    return;
  }

  const logMap = loadLogs();
  if (logMap[subjectId] != null) {
    // then check persistent storage
    console.debug(
      'logSubjectClassified() already logged previously. No-op',
      subjectId,
    );
    return;
  }

  // add an index to track the order of entry, 1-based
  // this is done so that when exporting the logs, the recent ones will be appended at the end
  const entryIdx = Object.keys(logMap).length + 1;
  logEntry.push(entryIdx);

  logMap[subjectId] = logEntry;
  console.debug('logSubjectClassified() Saving log:', subjectId, logEntry);
  saveLogs(logMap);
  lastSubjectIdClassified = subjectId;
} // function logSubjectClassified()

function clickInfoBtnAndLog() {
  clickInfoBtn();
  logSubjectClassified();
}

function exportSubjectClassifiedLog() {
  // convert the dictionary of log entries into a sorted array by idx
  const logs = [];
  for (const [k, v] of Object.entries(
    JSON.parse(localStorage['ctc2025SubjectLogs']),
  )) {
    v.unshift(k); // prepend k to the v array
    logs.push(v);
  }
  logs.sort((l, r) => l[5] - r[5]); // sort by idx so that the recent ones are at the end.

  let res = 'subject;tic;sector;source;marked_transits;idx\n';
  for (const l of logs) {
    res += `${l.join(';')}\n`;
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    `\
<div id="logOutputCtr" style="padding: 12px; z-index: 999; position: fixed; left: 25vw; top: 10vh; background-color: rgba(255, 255, 0, 0.8);">
    <div style="float: right; cursor: pointer;" onclick="this.parentElement.remove();">[X]</div>
    <p>Log of subjects classified, semi-colon separated.</p>
    <textarea readonly onclick="this.select();" style="width: 40vw; height: 50vh;">${res}</textarea>
</div>
`,
  );
  // return res;
}
// UI to export the log if it's enabled
if (toLogSubjectClassified) {
  GM_registerMenuCommand('Export Subjects Log', exportSubjectClassifiedLog);
}

//
// END   logic to log a subject being classified in CTC 2025

function clickInfoBtn() {
  const infoBtn = document.querySelector('button[title="Metadata"]');
  if (infoBtn) {
    infoBtn.click();
    return true;
  }
  console.warn('Cannot find Info Button. No-Op;');

  return false;
} // function clickInfoBtn()

const keyMap = {
  KeyI: clickInfoBtnAndLog, // clickInfoBtn,
  '!altKey': {
    KeyI: () => {
      clickInfoBtnAndLog();
      spawnExternalURLs();
    },
  },
  '!any-modifier': {},
};

//
// The following generic code is copied from Planet Hunter TESS Tweaks userjs
//
function handleViewerKeyboardShortcuts(evt) {
  if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(evt.target.tagName)) {
    // user typing in an input box or focuses on a button, do nothing
    return;
  }

  const handler = (() => {
    const hasAnyModifier =
      evt.altKey || evt.shiftKey || evt.ctrlKey || evt.metaKey;
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

function fillTemplate(template, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);

  // The Function constructor takes the argument names as strings, then the function body as a string
  const render = new Function(...keys, `return \`${template}\`;`);
  return render(...values);
}

function getMetaData(name) {
  let row = null;
  document.querySelectorAll('.modal-dialog table tbody > tr').forEach((tr) => {
    if (tr.querySelector('th')?.textContent === name) {
      row = tr;
    }
  });
  return row?.querySelector('td')?.textContent;
}

function message(msg, showDurationMillis = 3000) {
  document.body.insertAdjacentHTML(
    'beforeend',
    `
<div id="msgCtr" style="position: fixed;right: 4px;bottom: 10vh;background-color: rgba(255, 255, 0, 0.6);z-index: 9999;">
${msg}
</div>
`,
  );
  setTimeout(() => {
    document.getElementById('msgCtr')?.remove();
  }, showDurationMillis);
}

function getMetaDataTIC() {
  let tic = getMetaData('TICID'); // old classifying-the-classified
  if (!tic) {
    tic = getMetaData('tic'); // new classifying-the-classified-2025
  }
  return tic;
}

function getMetaDataSourceAndMarkedTransits() {
  if (
    getMetaData('RealTransit') == 'Transit-like events marked by volunteers'
  ) {
    return ['pht', getMetaData('MarkedTransits')];
  } else {
    return ['auto', '[]']; // the markedTransits from algorithm are just dummy times
  }
}

function extractSomeMetaData() {
  // Get a subset of subject metadata,
  // primarily for the purposes of filling in various templates
  const subject = (() => {
    if (location.pathname.endsWith('/classify')) {
      // case subject number not readily available, use lastSubjectIdClassified from subject log (but it might not have been enabled)
      return lastSubjectIdClassified ? lastSubjectIdClassified : -1;
    } else {
      // case subject / talk page
      // the selector for subject page / talk page respectively
      const [, res] = document
        .querySelector('.talk-list-content h1, h1.talk-page-header')
        ?.textContent?.match(/Subject\s+(\d+)/) || [null, -1];
      return res;
    }
  })();

  return {
    tic: getMetaDataTIC(),
    sector: getMetaData('thissector'),
    markedTransits: getMetaDataSourceAndMarkedTransits()[1],
    subject: subject,
  };
}

function copySomeMetaDataToClipboard(notifyUser = true) {
  const text = fillTemplate(
    my_GM_getValue('templateCopySomeMetaData', '${sector}, ${tic}'),
    extractSomeMetaData(),
  );

  GM_setClipboard(text);
  if (notifyUser) {
    message(`${text}<br>copied.`);
  }
  return text;
}

function openExternalURLInTab(templateName, defaultValue = '') {
  const extURL = fillTemplate(
    my_GM_getValue(templateName, defaultValue),
    extractSomeMetaData(),
  );
  if (extURL) {
    GM_openInTab(extURL, true); // in background
  }
}

function spawnExternalURLs() {
  openExternalURLInTab(
    'templateExtURL',
    'https://exofop.ipac.caltech.edu/tess/target.php?id=${tic}',
  );
  openExternalURLInTab('templateExtURL2');
  openExternalURLInTab('templateExtURL3');
}

function onDblClickToSpawnExternalURLs(evt) {
  if (
    !(
      evt.target.tagName === 'TD' &&
      ['TICID', 'tic'].includes(evt.target.previousElementSibling?.textContent)
    )
  ) {
    return;
  }

  // case on TICID cell

  if (!(evt.ctrlKey || evt.shiftKey || evt.altKey)) {
    copySomeMetaDataToClipboard();
    return;
  }

  // case with Ctrl / shift / AltKey
  spawnExternalURLs();
  copySomeMetaDataToClipboard();
}
document.addEventListener('dblclick', onDblClickToSpawnExternalURLs);
