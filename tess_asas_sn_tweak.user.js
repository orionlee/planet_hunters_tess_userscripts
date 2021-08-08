// ==UserScript==
// @name        TESS - ASAS-SN Variable tweak
// @namespace   astro.tess
// @match       https://asas-sn.osu.edu/variables*
// @grant       GM_addStyle
// @version     1.2
// @author      orionlee
// @description
// ==/UserScript==

//
// Search UI
//

function tweakSearchUI() {
  if (location.pathname === '/variables' && location.search) {
    // cae the page has query string params, i.e., a search is done
    // make search result above the fold

    // - hide decorative UIs that take up vertical space
    GM_addStyle(`
  .project-banner {
    display: none;
  }
  `);

    // - hide the search form to surface the result
    document.querySelector('button.panel-header-btn').click();
    // setTimeout(() => {
    // }, 1000);
  }
}
tweakSearchUI();


//
// Object Detail UI
//


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
`);
}
tweakObjectDetail();

// Extract IDs on object detail page for the purpose of cross matching.
function extractIds() {
  if (!isObjectDetailPage()) {
    return;
  }

  const [asasSnId] = document.querySelector('h3').textContent.trim().match(/^ASASSN-V J[0-9-.+]+/) || [null];
  const allwiseId = document.querySelector('.variable-star-data > div:nth-of-type(4) .row > div:nth-of-type(3) .star-data__value' )?.textContent;
  const otherId = document.querySelector('.variable-star-data > div:nth-of-type(4) .row > div:nth-of-type(4) .star-data__value' )?.textContent?.replace(/^-$/, '');
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
