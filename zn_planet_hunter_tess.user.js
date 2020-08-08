// ==UserScript==
// @name        Planet Hunter TESS Tweaks
// @namespace   astro.tess
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/*
// @grant       GM_addStyle
// @noframes
// @version     1.0.4
// @author      -
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
    // make wheel scrolling within viewer work better part 1
    // ensure mouse scroll within the viewer means zoom in/out (move the viewer mode to Move subject when necessary)
    function changeToMoveOnWheelInViewer(evt) {
      evt.preventDefault(); // prevent accidental window scrolling due to mouse wheel handled by browser

      // case already on move subject, no-op
      if (document.querySelector('button.hWUwko[title="Move subject"')) {
        return;
      }

      // set to Move subject mode, so the next wheel (typically right away) will be used to zoom
      clickViewerBtn('Move subject');
    } // function changeToMoveOnWheelInViewer(..)


    const lcvEl = getViewerSVGEl();
    if (lcvEl.changeToMoveOnWheelInViewerCalled) {
      return; // no need to init again
    }
    lcvEl.changeToMoveOnWheelInViewerCalled = true;

    lcvEl.addEventListener('wheel', changeToMoveOnWheelInViewer);
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

  function extractTicIdIfAny() {
    const ticId = getTicIdFromMetadataPopIn();
    if (ticId) {
      window.prompt("TIC ID for copy", "TIC " + ticId);
    }
  } // function extractTicIdIfAny()

  function initExtractTicIdIfAnyUI() {
    if (document.getElementById('extractTicIdIfAnyCtr')) {
      return false; // no need to re-init
    }
    document.body.insertAdjacentHTML('beforeend', `
<div id="extractTicIdIfAnyCtr" style="z-index: 9; position: fixed; top: 50px; right: 4px; padding: 4px 8px; background-color: rgba(255,168,0,0.5);">
  <button id="extractTicIdIfAnyCtl">TIC</button>
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

  if (location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/2112/')
      || location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/')) {
    initExtractTicIdIfAnyUI();
    // Possibly on a subject discussion thread.
    // try to add TIC to title. It needs some delay to ensure the tic data has been loaded
    setTimeout(showTicOnTitleIfAny, 5000); // TODO: consider to wait for ajax load rather than an arbitrary timeout
  }

})();

