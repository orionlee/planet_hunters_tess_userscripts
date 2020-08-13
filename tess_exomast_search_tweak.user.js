// ==UserScript==
// @name        TESS - ExoMAST search tweak
// @namespace   astro.tess
// @match       https://exo.mast.stsci.edu/
// @grant       GM_openInTab
// @noframes
// @version     1.0.13
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==


function fillSearchBoxByHash() {
  if (location.pathname == '/' && location.hash.startsWith('#search=')) {
    const searchTerm = location.hash.replace('#search=', '');

    if (searchTerm) {
      const iBoxEl = document.querySelector('input#search');
      iBoxEl.value = decodeURIComponent(searchTerm);
      iBoxEl.focus();
      // emulate keyboard press , to trigger ajax auto complete
      // see: https://stackoverflow.com/a/44190874
      // somehow a delay is needed to trigger auto complete
      setTimeout(() => {
        const success = iBoxEl.dispatchEvent(new KeyboardEvent('keydown',{'key':' '}));
        console.debug('dispatch result', success);
        // the intercept requires auto-complete to paint its UI
        // so try it with some delay, and try again to be safe
        // It could be done more robustly by using MutationObserver to wait for the UI to be constructed.
        setTimeout(interceptAutoCompleteClick, 500);
        setTimeout(interceptAutoCompleteClick, 1000);
        setTimeout(interceptAutoCompleteClick, 2000);
      }, 200);
    }
  }
} // function fillSearchBoxByHash()

fillSearchBoxByHash();

//
// Tweak to open TCE in a new window
//

function createTCEUrl(tceText) {
  const tceId = tceText.trim().replace(/[\s)()]/g, '');
  return `https://exo.mast.stsci.edu/exomast_planet.html?planet=${tceId}`
}

function showLinksToMatchingTCEs() {
  let uiCtr = document.querySelector('#tceURLsCtr ul');
  if (!uiCtr) {
    // the <div> needs extra margin-bottom, to avoid its links from being covered by the footer
    // setting z-index has no apparent effect
    document.querySelector('.ui-widget').insertAdjacentHTML('beforeend', `\
    <div id="tceURLsCtr" class="search-label" style="margin-bottom: 0.8in;">
      Matching TCEs:
      <ul style="font-size: 90%; margin: 0.5em 0 0 4ch !important;">
      </ul>
    </div>`) ;
    uiCtr = document.querySelector('#tceURLsCtr ul');
  }

  let tceLinksHTML = '';
  Array.from(document.querySelectorAll('#ui-id-1 li'), li => {
    const tceText = li.textContent;
    const tceUrl = createTCEUrl(tceText);
    tceLinksHTML += `  <li><a target="tce" href="${tceUrl}">${tceText}</a></li>\n`;
  })
  uiCtr.innerHTML = tceLinksHTML;
}

function openTCEinNewWindow(evt) {
  //console.log('intercept click', evt);
  evt.preventDefault();
  evt.stopPropagation()
  evt.stopImmediatePropagation();
  const tceUrl = createTCEUrl(evt.target.textContent);
  if (evt.ctrlKey || evt.button === 1) {
    // Open TCE to a new tab in background with middle-click or ctrl-click

    // compensate for the site's auto blur so that the list remains there
    // after users clicks one matching TCE
    showLinksToMatchingTCEs();

    GM_openInTab(tceUrl, true);
  } else {
    location.href = tceUrl;
  }
}

function interceptAutoCompleteClick() {
  // #ui-id-1 is the container for autocomplete UI
  document.getElementById('ui-id-1').onmouseover = (function (evt) {
    // install onclick to auto-complete UI's children, so that
    // clicking a TCE will open it to a new window
    if (evt.target.id !== 'ui-id-1') {
      evt.target.onmousedown = openTCEinNewWindow; // use onmousedown to capture middle-click
    }
  });
}
