// ==UserScript==
// @name        Vizier Match
// @namespace   astro.tess
// @match       https://vizier.cds.unistra.fr/viz-bin/VizieR-*
// @match       https://vizier.cfa.harvard.edu/viz-bin/VizieR-*
// @noframes
// @grant       GM_addStyle
// @version     1.0.1
// @author      -
// @description Match of arbitrary string in search result.
//              Motivational use case is to
//              match Gaia Source from a TIC with search result.
// @icon        https://vizier.u-strasbg.fr/favicon.ico
// ==/UserScript==


function highlightMatches() {
  /// console.debug(`highlightMatches()`);
  const matchString = sessionStorage['matchString'];
  if (!matchString) {
    return false;
  }
  /// console.debug(`highlightMatches(): matchString=${matchString}`);

  GM_addStyle(`
tr.matched > td:first-of-type {
  background-color: yellow;
  font-weight: bold;
}
  `);

  delete sessionStorage['matchString']; // about to process it, to remove it from storage.

  // Search result table rows for matches
  let hasMatches = false;
  Array.from(document.querySelectorAll('tr.tuple-1, tr.tuple-2')).forEach( (tr) => {
    if (tr.textContent.indexOf(matchString) >= 0) {
      tr.classList.add('matched');
      hasMatches = true;
    }
  });

  if (hasMatches) {
    document.body.insertAdjacentHTML('beforeend', `
<div id="stringMatchMsg"
     style="padding: 8px 18px; background-color: rgba(255, 255, 0, 0.6); position: fixed; bottom: 2vh; right: 1vw;"
     onclick="this.remove();"
    >
    ${matchString} found in result.
</div>`);
  }
}
highlightMatches();  // case result is after a form submit (HTTP POST)


// Note: the extraction must be called after the highlightMatches
// to support the form submit > result workflow
function extractMatchStrFromHash() {
  /// console.debug(`extractMatchStrFromHash()`);
  const [, matchString] = location.hash.match(/matchString=([^&]+)/) || [null, null];
  if (!matchString) {
    return false;
  }
  // Store it in sessionStorage, as typical the match string
  // starts from a form that will be submitted.
  sessionStorage['matchString'] = matchString;
  /// console.debug(`extractMatchStrFromHash(): matchString=${matchString}`);

  return true;
}
const extracted = extractMatchStrFromHash();

// case the hash is added to a search result GET url
// need to process it right away
if (extracted && location.search.indexOf('&-bmark=GET') >= 0) {
  highlightMatches();
  // remove the has from  browser location
  history.pushState("", document.title, location.pathname + location.search);
}
