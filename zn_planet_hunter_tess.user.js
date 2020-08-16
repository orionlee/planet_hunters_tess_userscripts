// ==UserScript==
// @name        Planet Hunter TESS Tweaks
// @namespace   astro.tess
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/*
// @grant       GM_addStyle
// @grant       GM_openInTab
// @noframes
// @version     1.0.18
// @author      orionlee
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

// helper for debug messages used to understand timing of ajax loading (and related MutationObserver)
function ajaxDbg(... args) {
  console.log(...(['[DBG]'].concat(args)));
}

// General helpers to handle initial top level ajax load
function onMainLoaded(handleFn) {
  const mainEl = document.querySelector('main');
  if (!mainEl) {
    console.error('onMainLoaded() - the <main> element is missing unexpectedly. Cannot wait.');
    return false;
  }
  const mainObserver = new MutationObserver(function(mutations, observer) {
    ajaxDbg('onMainLoaded() - main is changed, begin handling')
    if (handleFn()) {
      ajaxDbg('onMainLoaded() - stop observing as hooks to wait for ajax load done');
      observer.disconnect();
    } // continue to observe
  })
  mainObserver.observe(mainEl, { childList: true, subtree: true });
}


const PATH_CLASSIFY = '/projects/nora-dot-eisner/planet-hunters-tess/classify';

(function customizeClassify() {

  (function injectCSS() {
    GM_addStyle(`
#lightCurveViewerExpandCtr {
  display: none;
}

@media (min-width: 701px) {
  /* make lightcurve occupies most of the window by compressing the right-sided box (that has Done Button)
     Overwriting the shipped .blYUEA rule
     Use our own .x-light-curve-root so that the rule here is not tied to the shipped class name
     */
  .lcv-expanded .x-light-curve-root {
      grid-template-columns: 8fr 13rem; /* down from 25.3rem */
  }

  #lightCurveViewerExpandCtr {
    display: block;
  }

  #lightCurveViewerExpandCtl:before {
    content: "Expand LC >";
  }

  .lcv-expanded #lightCurveViewerExpandCtl:before {
    content: "< Shrink LC";
  }

  /* make marked transit areas cover all the way to the bottom
     when the viewer becomes taller in expanded state.
     Use 10000px to approximate 100% height
   */
  .lcv-expanded .annotations-layer rect.selection {
    height: 10000px;
  }

}

/* make the buttons below the view right-aligned, easier to access */
.x-light-curve-root > section > div:last-of-type {
  margin-left: auto;
  margin-right: 0;
}


/* make the lightcurve data json on subject viewer not taking up whole screen height */
.subject-viewer .text-viewer {
    max-height: 400px; /* 400 is roughly the same height of lightcurve images */
    overflow-y: scroll;
}

`);
  })(); // function injectCSS()

  function getViewerSVGEl() {
    return document.querySelector('svg.light-curve-viewer');
  }

  function annotateViewerRoot() {
    // find the container that controls the size of the light-curve
    // annotate it for the use with SVG
    const lightCurveEl = document.querySelector('div.light-curve-viewer');
    if (lightCurveEl) {
      const rootEl = lightCurveEl.parentElement.parentElement.parentElement;
      rootEl.classList.add('x-light-curve-root');
      return rootEl;
    } else {
      return null;
    }
  } // function annotateViewerRoot()

  // for the buttons to the right of the lightcurve,
  // It does not work for the buttons below the lightcurve (they don't have title)
  function clickViewerBtn(btnTitle) {
    if (location.pathname !== PATH_CLASSIFY) {
      return false;
    }
    const btn = document.querySelector(`button[title="${btnTitle}"]`);
    if (btn) {
      btn.click();
      // focus on viewer so that built-in viewer shortcuts will work
      const rootEl = annotateViewerRoot();
      if (rootEl) {
        rootEl.querySelector('svg').focus();
      }
      return true;
    }
    return false;
  } // function clickViewerBtn(..)


  function toggleExpandedViewer() {
    // only applicable to classify page
    if (location.pathname !== PATH_CLASSIFY) {
      return;
    }

    // add expanded at doc root, so that in case LC viewer is not yet loaded, we can still let it be in expanded state
    document.documentElement.classList.toggle('lcv-expanded');
    const rootEl = annotateViewerRoot()
    if (rootEl) {
      rootEl.scrollIntoView();
      rootEl.querySelector('svg').focus(); // to make built-in keyboard shortcuts work without users clicking
    } else {
      console.warn('toggleExpandedViewer() - cannot find light curve viewer container - cannot focus it')
    }
  } // function toggleExpandedViewer()

  function initToggleExpandedViewerUI() {
    if (document.getElementById('lightCurveViewerExpandCtr')) {
      return false; // already created. no need to do it again
    }

    document.body.insertAdjacentHTML('beforeend', `
  <div id="lightCurveViewerExpandCtr" style="z-index: 9; position: fixed; top: 10px; right: 4px; padding: 4px 8px; background-color: rgba(255,255,0,0.5);">
      <button id="lightCurveViewerExpandCtl"></button>
  </div>`);
    document.getElementById('lightCurveViewerExpandCtl').onclick = toggleExpandedViewer;

    toggleExpandedViewer(); // set viewer to expanded state
    return true;
  } // function initToggleExpandedViewerUI()


  let addKeyMapToViewerCalled = false;
  function addKeyMapToViewer() {
    if (addKeyMapToViewerCalled) {
      return; // No need to set the keymap (on window object), say, during ajax load
    } else {
      addKeyMapToViewerCalled = true;
    }

    function clickSubjectInfoOnClassify() {
      if (location.pathname !== PATH_CLASSIFY) {
        return false;
      }

      const infoBtn = document.querySelector('.x-light-curve-root > section > div:last-of-type > button:first-of-type');
      if (infoBtn) {
        infoBtn.click();
        return true;
      }

      return false;
    } // function clickSubjectInfoOnClassify()

    function clickReset() {
      return clickViewerBtn('Reset subject view');
    }

    function clickMove() {
      return clickViewerBtn('Move subject');
    }

    function clickAnnotate() {
      return clickViewerBtn('Annotate');
    }

    const keyMap = {
      "KeyI":    clickSubjectInfoOnClassify,
      "Numpad1": clickSubjectInfoOnClassify,
      // also accepts Numpad1 is convenient for users who frequent use numpad +/-/0

      "Digit0":  clickReset,
      "Numpad0": clickReset,
      "KeyO":    clickReset,
      // also accepts  KeyO as an alterative as it's close to keyM used below

      "KeyM":    clickMove,

      "KeyA":    clickAnnotate,
      "Comma":   clickAnnotate,
      // also accepts use comma as an alternative as it is close to keyM
    };

    function handleViewerKeyboardShortcuts(evt) {
      const handler = keyMap[evt.code];
      if (handler && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
        const success = handler();
        if (success) {
          evt.preventDefault();
        }
      }
    }
    window.addEventListener('keydown', handleViewerKeyboardShortcuts);

  } // function addKeyMapToViewer()

  function tweakWheelOnViewer() {

    const lcvEl = getViewerSVGEl();
    if (lcvEl.tweakWheelOnViewerCalled) {
      return; // no need to init again
    }
    // else start the init
    lcvEl.tweakWheelOnViewerCalled = true;


    function isBtnHighlighted(btnTitle) {
      // .hWUwko css class for active button
      return document.querySelector(`button.hWUwko[title="${btnTitle}"]`);
    }

    // make wheel scrolling within viewer work better part 1
    // ensure mouse scroll within the viewer means zoom in/out (move the viewer mode to Move subject when necessary)
    function changeToMoveOnWheelInViewer(evt) {
      evt.preventDefault(); // prevent accidental window scrolling due to mouse wheel handled by browser

      // case already on move subject, no-op
      if (isBtnHighlighted('Move subject')) {
        return;
      }

      // set to Move subject mode, so the next wheel (typically right away) will be used to zoom
      clickViewerBtn('Move subject');
    } // function changeToMoveOnWheelInViewer(..)
    lcvEl.addEventListener('wheel', changeToMoveOnWheelInViewer);


    // Use middle button to toggle between Annotate / Move subject
    function toggleAnnotateMoveOnMiddleClickInViewer(evt) {
      // we intercept middle click (button === 1) only
      if (evt.button !== 1) {
        return;
      }

      evt.preventDefault(); // prevent system default

      // case already on move subject, no-op
      if (isBtnHighlighted('Move subject')) {
        clickViewerBtn('Annotate');
      } else {
        clickViewerBtn('Move subject');
      }
    } // function toggleAnnotateMoveOnMiddleClickInViewer(..)
    lcvEl.addEventListener('mousedown', toggleAnnotateMoveOnMiddleClickInViewer);
  }

  function doCustomizeViewer() {
    ajaxDbg('doCustomizeViewer() - start customization');

    // also make the focus on svg so that built-in keyboard shortcuts would work too
    clickViewerBtn('Move subject');

    // expand the viewer
    initToggleExpandedViewerUI();

    // intercept browser's default wheel behavior when wheeling on the viewer SVG
    tweakWheelOnViewer();

    addKeyMapToViewer(); // additional keyboard shortcuts
  }

  //
  // Plumbing codes to trigger actual viewer customization upon ajax load (for initial load)
  //
  let customizeViewerCalled = false;
  function customizeViewer() {
    if (customizeViewerCalled) { // to avoid being called repeatedly upon svg modification
      return;
    }
    customizeViewerCalled = true;

    doCustomizeViewer();
  }

  function customizeViewerOnSVGLoaded() {
    const lcvEl = getViewerSVGEl();
    const lcvObserver = new MutationObserver(function(mutations, observer) {
      observer.disconnect();
      // The SVG will be modified a few times by zooniverse code (to load lightcurve, etc.)
      // So we wait a bit to let it finish before customizing
      setTimeout(customizeViewer, 500);
    });

    if (!lcvEl) {
      ajaxDbg('customizeViewerOnSVGLoaded() - svg not yet present. NO-OP');
      return false; // svg not yet there so wait

    }
    ajaxDbg('customizeViewerOnSVGLoaded() - wait for svg loaded. svg children:', document.querySelector('svg.light-curve-viewer').children);
    customizeViewerCalled = false;
    lcvObserver.observe(lcvEl, { childList: true, subtree: true });
    return true;
  }

  if (location.pathname === PATH_CLASSIFY) {
    onMainLoaded(customizeViewerOnSVGLoaded);
  }

  //
  // Plumbing codes to trigger actual viewer customization upon user click done (that load viewer with new data)
  //
  function customizeViewerOnDoneClicked(evt) {
    if (evt.target.textContent.toLowerCase() === 'done' &&
        !evt.shiftKey) { // ignore cases when shift is pressed.

      // observe the changes so that once the new data is loaded to viewer
      // customization will be applied again.
      return customizeViewerOnSVGLoaded();
    }
  } // function customizeViewerOnDoneClicked(..)
  window.addEventListener('click', customizeViewerOnDoneClicked);

})();


(function customizeSubjectTalk() {
  //
  // Tools to extract TIC on subject talk page
  //

  function getTicIdFromMetadataPopIn() {
    // open the pop-in
    document.querySelector('button[title="Metadata"]').click();

    const metadataCtr = document.querySelector('.modal-dialog .content-container > table');
    if (!metadataCtr) {
      return null;
    }

    const ticThs = Array.from(metadataCtr.querySelectorAll('th'))
      .filter( th => th.textContent == 'TIC ID' );

    if (ticThs.length < 1) {
      return null;
    }


    const result = ticThs[0].parentElement.querySelector('td').textContent;

    const closeBtn = document.querySelector('form.modal-dialog button.modal-dialog-close-button');
    if (closeBtn) {
      closeBtn.click();
    }

    return result;
  } // function getTicIdFromMetadataPopIn()

  function showHideTicPopin(ticId) {

   const popinCtr = document.getElementById('ticPopin');
   if (popinCtr) {
     // toggle hide show
     popinCtr.style.display = popinCtr.style.display === 'none' ? 'block' : 'none';
   } else {
     // create one
     document.body.insertAdjacentHTML('beforeend', `\
<div id="ticPopin" style="display: block; position: fixed; top: 20px; right: 10vh; padding: 1em 3ch; z-index: 9999; background-color: lightgray; border: 1px solid black;">
  <a style="float: right; font-weight: bold;" href="javascript:void(0);" onclick="this.parentElement.style.display='none';">[X]</a>

  <br>
  TIC <input id="ticIdForCopy" style="display: inline-block; border: 0;" readonly value="${ticId}">
  &emsp;<button id="ticCopyCtl">Copy</button>
  &emsp;<button id="ticCopyNAddToNoteCtl">Copy & Add to note</button>
  <br><br>
  Subject info., including TOI:<br>
  <a target="_blank" href="https://exofop.ipac.caltech.edu/tess/target.php?id=${ticId}" ref="noopener nofollow">https://exofop.ipac.caltech.edu/tess/target.php?id=${ticId}</a>

  <br><br>
  Search TCEs:<br>
  <a target="_blank" href="https://exo.mast.stsci.edu/#search=TIC%20${ticId}" ref="noopener nofollow">https://exo.mast.stsci.edu/</a>

  <br><br>
  When TIC will be observed:<br>
  <a target="_blank" href="https://heasarc.gsfc.nasa.gov/cgi-bin/tess/webtess/wtv.py?Entry=${ticId}" ref="noopener nofollow">https://heasarc.gsfc.nasa.gov/cgi-bin/tess/webtess/wtv.py?Entry=${ticId}</a>

  <br><br>
  <button id="ticShowMetadataCtl">Metadata</button>
 </div>`);

    // bind buttons generated to actual logic

    const hideTicPopin = () => {
      document.getElementById('ticPopin').style.display = 'none';
    };

    const copyTicToClipboard = () => {
      document.getElementById('ticIdForCopy').focus();
      document.getElementById('ticIdForCopy').select();
      const success = document.execCommand('copy');
      console.debug('Copy TIC success:', success);
    };

    const addTicToNote = () => {
      const ticId = document.getElementById('ticIdForCopy').value;
      const noteEl = document.querySelector('form.talk-comment-form textarea');
      const addNewLine = !(['', '\n', '\r'].includes(noteEl.value.charAt(noteEl.value.length - 1)));
      noteEl.value += `${addNewLine ? '\n': ''}TIC ${ticId}\n`;
      noteEl.focus();
    };

    document.getElementById('ticCopyCtl').onclick = () => {
      copyTicToClipboard();
      hideTicPopin();
    };

    document.getElementById('ticCopyNAddToNoteCtl').onclick = () => {
      copyTicToClipboard();
      addTicToNote();
      hideTicPopin();
    };

    document.getElementById('ticShowMetadataCtl').onclick = () => {
      document.querySelector('button[title="Metadata"]').click();
      hideTicPopin();
    };

   }
  } // function showTicPopin()

  function extractTicIdIfAny() {
    const ticId = getTicIdFromMetadataPopIn();
    if (ticId) {
      showHideTicPopin(ticId);
    }
  } // function extractTicIdIfAny()

  function initExtractTicIdIfAnyUI() {
    if (document.getElementById('extractTicIdIfAnyCtr')) {
      return false; // no need to re-init
    }
    document.body.insertAdjacentHTML('beforeend', `
<div id="extractTicIdIfAnyCtr" style="z-index: 9; position: fixed; top: 50px; right: 4px; padding: 4px 8px; background-color: rgba(255,168,0,0.5);">
  <button id="extractTicIdIfAnyCtl" accesskey="T">TIC</button>
</div>`);
    document.getElementById('extractTicIdIfAnyCtl').onclick = extractTicIdIfAny;
    return true;
  } // function initExtractTicIdIfAnyUI()

  function showTicOnTitleIfAny() {
    const ticId = getTicIdFromMetadataPopIn();
    if (ticId) {
      document.title = 'TIC' + ticId + ' | ' + document.title;
    }
  }

  // TODO: support cases the thread was ajax loaded, e.g., traversing from parent talk topics to the thread
  if (location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/')
    || location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/2112/') // Notes (of subjects)
    || location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/2110/') // Planets!
    || location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/2107/') // Strange Stars
  ) {
    initExtractTicIdIfAnyUI();
    // Possibly on a subject discussion thread.
    // try to add TIC to title. It needs some delay to ensure the tic data has been loaded
    setTimeout(showTicOnTitleIfAny, 5000); // TODO: consider to wait for ajax load rather than an arbitrary timeout
  }

  // ------------

  function openTalkSearchInNewTab(talkForm) {
    const query = talkForm.querySelector('input').value;
    const searchUrl = query.startsWith('#') ?
    `https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/tags/${query.slice(1)}` :
    `https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/search?query=${encodeURIComponent(query)}`;

    GM_openInTab(searchUrl, true); // open the search in the a new tab in background.
  }
  function tweakTalkSearch() {
    const talkForm = document.querySelector('form.talk-search-form');
    if (talkForm.tweakCalled) {
      return; // avoid repeated init
    }
    talkForm.tweakCalled = true;

    // Open talk search in a new tab for:

    // 1. Ctrl-click or middle button click
    talkForm.querySelector('button').onmousedown = (evt) => {
      // middle button click or ctrl-click
      if (evt.ctrlKey || evt.button === 1) {
        evt.preventDefault();
        openTalkSearchInNewTab(talkForm);
      }
    };

    // 2. Ctrl-Enter
    talkForm.querySelector('input').onkeydown = (evt) => {
      if (evt.ctrlKey && evt.code === 'Enter') {
        evt.preventDefault();
        openTalkSearchInNewTab(talkForm);
      }
    };
  }
  if (location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk')) {
    setTimeout(tweakTalkSearch, 5000);
  }

  // ------------

  function autoLinkTICIds() {
    const replaceExpr = '$1<a href="https://exofop.ipac.caltech.edu/tess/target.php?id=$2">TIC $2</a> <sup style="font-size: 70%;">[<a href="/projects/nora-dot-eisner/planet-hunters-tess/talk/search?query=TIC $2">Talk</a>]</sup>';
    const ticReList = [
      /(\s+)TIC(?:\s*ID)?\s*(\d+)/mgi,  // regular text match, with space preceding to ensure it is not, say, part of an URL
      /(^)TIC(?:\s*ID)?\s*(\d+)/mgi,  // cases the TIC  is at start of a line
      /(<p>)TIC(?:\s*ID)?\s*(\d+)/mgi, // cases the TIC is visually at the start of the line, e.g., <p>TIC 12345678
      /(<br>)TIC(?:\s*ID)?\s*(\d+)/mgi, // cases the TIC is visually at the start of the line, e.g., <br>TIC 12345678
    ];
    Array.from(document.querySelectorAll('.talk-comment-body .markdown'), commentEl => {
      let changed = false;
      let html = commentEl.innerHTML;
      ticReList.forEach( ticRe => {
        if (html.match(ticRe)) {
          html = html.replace(ticRe, replaceExpr);
          changed = true;
        }
      });
      if (changed) {
        commentEl.innerHTML = html;
      }
    });
  }
  // match any threads
  if (location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/')
    || location.pathname.match(/\/projects\/nora-dot-eisner\/planet-hunters-tess\/talk\/\d+\/\d+.*/)) {
    setTimeout(autoLinkTICIds, 5000);
  }

})();

