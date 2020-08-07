// ==UserScript==
// @name        Planet Hunter TESS Tweaks
// @namespace
// @match       https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/*
// @grant       GM_addStyle
// @noframes
// @version     1.0.1
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

(function injectCSS() {
  GM_addStyle(/*css*/`
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

.hide-headers header {
  display: none;
}

#hideShowHeaderCtl:before {
  content: "< Header";
}

.hide-headers #hideShowHeaderCtl:before {
  content: "Header >";
}
`)
})(); // function injectCSS()



// Tips for tracking lightcurve viewer changes due to ajax load after pressing done
// 1.add a click listener to done
// 2. observe mutation changes of document.querySelector('svg.light-curve-viewer'), use config {childList: true}
// 3. when ajax loads, the curve is changed
// 4. do what whatever is done upon the changes
// 5. disconnect the observer, as any zoom, etc., will also change the it.
// @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver

function annotateViewerRoot() {
  // find the container that controls the size of the light-curve
  const lightCurveEl = document.querySelector('div.light-curve-viewer');
  if (lightCurveEl) {
    const rootEl = lightCurveEl.parentElement.parentElement.parentElement;
    rootEl.classList.add('x-light-curve-root');
    return rootEl;
  } else {
    return null;
  }
} // function annotateViewerRoot()

window.toggleExpandedViewer = function () {
  // only applicable to classify page
  if (location.pathname != '/projects/nora-dot-eisner/planet-hunters-tess/classify') {
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
}; // function toggleExpandedViewer()

function initToggleExpandedViewerUI() {
  document.body.insertAdjacentHTML('beforeend', `
<div id="lightCurveViewerExpandCtr" style="z-index: 9; position: fixed; top: 10px; right: 4px; padding: 4px 8px; background-color: rgba(255,255,0,0.5);">
    <button id="lightCurveViewerExpandCtl"></button>
</div>`);
  document.getElementById('lightCurveViewerExpandCtl').onclick = toggleExpandedViewer;
} // function initToggleExpandedViewerUI()

initToggleExpandedViewerUI();
if (location.pathname === '/projects/nora-dot-eisner/planet-hunters-tess/classify') {
  setTimeout(toggleExpandedViewer, 2000);
}



//
// Add additional keyboard shortcuts to the existing
// zoom-in/out (+ / -), pan left / right (left arrow / right arrow)
//

//
// Click subject info on classify screen
//

function clickSubjectInfoOnClassify() {
  if (location.pathname != "/projects/nora-dot-eisner/planet-hunters-tess/classify") {
    return false;
  }

  const infoBtn = document.querySelector('.x-light-curve-root > section > div:last-of-type > button:first-of-type');
  if (infoBtn) {
    infoBtn.click();
    return true;
  }

  return false;
} // function clickSubjectInfoOnClassify()

function showSubjectInfoOnKey(evt) {
  // Press I or Numpad 1 (mnemonic of I closer to other keyboard shortcuts)
  if ((evt.code === "KeyI" || evt.code === "Numpad1")
      && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
    console.debug('About to show subject info upon event ', evt);
    const success = clickSubjectInfoOnClassify();
    if (success) {
      evt.preventDefault();
    }
  }
} // function showSubjectInfoOnKey(..)
(function() {
  window.addEventListener('keydown', showSubjectInfoOnKey)
})(); // (function())



function clickViewerBtn(btnTitle) {
  if (location.pathname != "/projects/nora-dot-eisner/planet-hunters-tess/classify") {
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

function resetViewerOnKey(evt) {
  // Press 0
  if ((evt.code === "Digit0" || evt.code === "Numpad0" || evt.code === "KeyO") // use letter O as an alterative as it's close to keyM used below
       && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
    console.debug('About to reset viewer upon event ', evt);
    const success = clickViewerBtn('Reset subject view');
    if (success) {
      evt.preventDefault();
    }
  }

} // function resetViewerOnKey(..)
(function() {
  window.addEventListener('keydown', resetViewerOnKey);
})(); // (function())


function toViewerMoveModeOnKey(evt) {
  if ((evt.code === "KeyM")
       && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
    const success = clickViewerBtn('Move subject');
    if (success) {
      evt.preventDefault();
    }
  }
} // function toViewerMoveModeOnKey(..)
(function() {
  window.addEventListener('keydown', toViewerMoveModeOnKey);
})(); // (function())


function toViewerAnnotateModeOnKey(evt) {
  if ((evt.code === "KeyA" || evt.code === "Comma") // use comma as an alternative as it is close to keyM
       && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
    const success = clickViewerBtn('Annotate');
    if (success) {
      evt.preventDefault();
    }
  }
} // function toViewerMoveModeOnKey(..)
(function() {
  window.addEventListener('keydown', toViewerAnnotateModeOnKey);
})(); // (function())



/* does not work
function zoomMaxViewerOnKey(evt) {
  // Press 0
  if ((evt.code === "Digit9" || evt.code === "Numpad9")
       && !evt.altKey && !evt.shiftKey && !evt.ctrlKey) {
    console.debug('About to reset viewer upon event ', evt);
    const success = clickViewerBtn('Zoom in on subject');
    if (success) {
      evt.preventDefault();
    }
  }
} // function zoomMaxViewerOnKey(..)
window.addEventListener('keydown', zoomMaxViewerOnKey);
*/


// Customize Viewer default config

function customizeViewer() {
  clickViewerBtn('Move subject'); // also make the focus on svg so that built-in keyboard shortcuts would work too


  // make wheel scrolling within viewer work better part 1/2
  // ensure mouse scroll within the viewer means zoom in/out (move the viewer mode to Move subject when necessary)
  function changeToMoveOnWheelInViewer(evt) {
    if (evt.target.tagName.toLowerCase() !== 'rect') {
      return;
    }

    evt.preventDefault(); // prevent accidental window scrolling due to mouse wheel handled by browser

    // already on move
    if (document.querySelector('button.hWUwko[title="Move subject"')) {
      return;
    }

//    console.debug('Viewer: try to stop scroll by wheel in say, Annotate mode. Change to Move subject mode')
//    evt.preventDefault();
//    evt.stopImmediatePropagation();
//    evt.stopPropagation();

    // set to Move subject mode, so the next wheel (typically right away) will be used to zoom
    clickViewerBtn('Move subject');
    // does not work... clickViewerBtn('Reset subject view'); // sometimes expanded LC has weird zoom
  } // function changeToMoveOnWheelInViewer(..)

  // must add it to svg (rather than window) to intercept browser's default wheel behavior
  const viewerEl = document.querySelector('svg.light-curve-viewer');
  if (viewerEl) {
    viewerEl.addEventListener('wheel', changeToMoveOnWheelInViewer);
    return true;
  }
  // else customization cannot complete.
  return false;

} // function customizeViewer()

let numTries = 0;
function tryCustomizeViewer() {
  const success = customizeViewer();
  numTries++;
  if (!success) {
    console.debug('viewer not yet ready, retry...');
    setTimeout(tryCustomizeViewer, 1000);
  }
} // function tryCustomizeViewer()

setTimeout(customizeViewer, 1500); // customize upon the first (regular HTTP) load, use setTimeout to account for ajax load

// Set the same customization upon loading the next subject (by clicking done) via ajax

function onViewerMutate(mutationsList, observer) {
  ///console.debug('onViewerMutate()', mutationsList);
  observer.disconnect(); // no need to observe anymore.
  setTimeout(customizeViewer, 500); // delay to ensure the LC viewer is properly initialized
}


window.lcViewerObserver = new MutationObserver(onViewerMutate);

function customizeViewerOnLoad(evt) {
  if (evt.target.textContent.toLowerCase() === 'done' &&
      !evt.shiftKey) { // ignore cases when shift is pressed.
    // before ajax load, observe the changes so that once the new viewer is loaded
    // it wil be called.
    const lcvEl = document.querySelector('svg.light-curve-viewer');
    if (lcvEl) {
      lcViewerObserver.observe(lcvEl, { childList: true, subtree: true });
    }
    return true;
  } else {
    return false; // still let the default click event fired
  }
} // function customizeViewerOnLoad(..)
(function() {
  window.addEventListener('click', customizeViewerOnLoad);
})(); // (function())


/*
(function() {
  // make wheel scrolling within viewer work better part 2/2

  // hide headers in viewer to avoid wheel scroll in viewer spill to scrolling window (when viewer is in move subject mode)
  if (location.pathname == "/projects/nora-dot-eisner/planet-hunters-tess/classify") {
    document.documentElement.classList.add('hide-headers');
  }

  document.body.insertAdjacentHTML('beforeend', `\
<div id="hideShowHeaderCtr" style="position: fixed;z-index: 9;left: 0;top: 0;padding: 4px 4px;background-color: rgba(31,31,31,0.5);">
  <button id="hideShowHeaderCtl"></button>
</div>`);
  document.getElementById('hideShowHeaderCtl').onclick = function() {
    document.documentElement.classList.toggle('hide-headers');
  }; // document.getElementById('hideShowHeaderCtl').onclick = function()

})(); // (function())
*/



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
  document.body.insertAdjacentHTML('beforeend', `
<div style="z-index: 9; position: fixed; top: 50px; right: 4px; padding: 4px 8px; background-color: rgba(255,168,0,0.5);">
<button id="extractTicIdIfAnyCtl">TIC</button>
</div>`);
  document.getElementById('extractTicIdIfAnyCtl').onclick = extractTicIdIfAny;
} // function initExtractTicIdIfAnyUI()
initExtractTicIdIfAnyUI();

function showTicOnTitleIfAny() {
  const ticId = getTicIdFromMetadataPopIn();
  if (ticId) {
    document.title = 'TIC' + ticId + ' | ' + document.title
  }
}

if (location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/2112/')
    || location.pathname.startsWith('/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/')) {
  // Possibly on a subject discussion thread.
  // try to add TIC to title. It needs some delay to ensure the tic data has been loaded
  setTimeout(showTicOnTitleIfAny, 5000)
}

