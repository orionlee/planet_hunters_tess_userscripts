// ==UserScript==
// @name        TESS - ASAS-SN Variable tweak
// @namespace   astro.tess
// @match       https://asas-sn.osu.edu/variables*
// @grant       GM_addStyle
// @version     1.7.0
// @author      orionlee
// @description
// ==/UserScript==

//
// Search UI
//

function tweakSearchResult() {
  if (!(location.pathname === '/variables' && location.search)) {
    return;
  }
  // case the page has query string params, i.e., a search is done
  // make search result above the fold

  // - hide decorative UIs that take up vertical space
  GM_addStyle(`
.project-banner {
  display: none;
}`);

  // - hide the search form to surface the result
  document.querySelector('button.panel-header-btn').click();

  function getSearchResultRows() {
    return Array.from(document.querySelectorAll('table tbody tr'));
  }

  // indicate num entries found. 0 would be helpful to ignore the result without opening the tab
  const resRows = getSearchResultRows();
  document.title = `(${resRows.length}) - ${document.title}`;
  if (resRows.length > 0) {
    // indicate the angular distance (5th column) of the first match as well.
    const angDist1stMatch = parseInt(resRows[0].querySelector('td:nth-of-type(5)').textContent.trim());
    document.title = `(${angDist1stMatch}") ` + document.title;
  }

  function tweakSearchResultRows() {
    getSearchResultRows().forEach((tr, i) => {
      const linkEl = tr.querySelector('a')
      const distance = tr.querySelector('td:nth-of-type(5)').textContent
      linkEl.setAttribute('href', linkEl.getAttribute('href') + `#distance=${distance}`);
      linkEl.removeAttribute('target');
      linkEl.accessKey = i + 1;  // Alt-1, Alt-2, etc.
    });
  }
  tweakSearchResultRows();


  function gotoObjectDetailIfOnly1ResultReturned() {
    const rows = getSearchResultRows();
    if (rows.length != 1) {
      return;
    }

    // set location rather than clicking the link
    // to avoid opening a new window
    location.href = rows[0].querySelector('a').href;
  }
  gotoObjectDetailIfOnly1ResultReturned();
}
tweakSearchResult();


//
// Object Detail UI
//


// reset the hash, so that if an user copies the URL, the user won't copy the extra parameters in the hash
// (that would be useless in general)
function resetHash() {
  history.pushState("", document.title, location.pathname + location.search);
}

function isObjectDetailPage() {
  return location.pathname.match(/^\/variables\/\w+/);
}

function tweakObjectDetail() {
  if (!isObjectDetailPage()) {
    return;
  }

  GM_addStyle(`
a#variable-db-atlas-link {
    text-decoration: underline;
}

/* To style distance from search coordinate output */
#distance_ctr {
  color: #999;
  font-style: italic;
}
`);

  const [, distance] = location.hash.match(/distance=([0-9.]+)/) || [null, null];
  if (distance) {
    document.querySelector('h3').insertAdjacentHTML('afterend', `
<span id="distance_ctr">distance: ${distance}"</span>`);
      document.title = `${parseInt(distance)}" ${document.title}`;
    resetHash();
  }

}
tweakObjectDetail();


function normalizeAlias(aliasText) {
  let res = aliasText?.trim();
  if (!res) {
    return '';
  }
  // normalize ATLAS id to the form used by VSX / SIMBAD
  if (res.startsWith('ATLASJ')) {
    // for TYC, remove leading zeros, e.g., 123-01234
    // both SIMBAD and VSX use the version without leading zeros
    res = res.replace(/^ATLASJ/, 'ATO J');
  }
  return res;
}

// Extract IDs on object detail page for the purpose of cross matching.
function extractIds() {
  if (!isObjectDetailPage()) {
    return;
  }

  const [asasSnId] = document.querySelector('h3').textContent.trim().match(/^ASASSN-V J[0-9-.+]+/) || [null];
  const allwiseId = document.querySelector('.variable-star-data > div:nth-of-type(4) .row > div:nth-of-type(3) .star-data__value' )?.textContent;
  const otherId = normalizeAlias(document.querySelector('.variable-star-data > div:nth-of-type(4) .row > div:nth-of-type(4) .star-data__value' )?.textContent?.replace(/^-$/, ''));

  const url = location.href;

  document.body.insertAdjacentHTML('beforeend', `
<div id="crossMatchCtr" style="position: fixed;right: 6px;top: 6px;padding: 4px 6px;background-color: rgba(255, 255, 0, 0.7);"
     title="For cross-match's use. Shortcut: Alt-L">
  <input id="crossMatchOut" value="" accessKey="L" onclick="this.select();" readonly>
</div>
  `);
  document.getElementById('crossMatchOut').value = `${asasSnId}\t${otherId},WISEA ${allwiseId}\t${url}`
}
extractIds();
