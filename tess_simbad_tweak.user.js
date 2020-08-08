// ==UserScript==
// @name        TESS - SIMBAD tweak
// @namespace   astro.tess
// @match       http://simbad.u-strasbg.fr/simbad/sim-coo?Coord=*
//                ^^^ links generated from ExoFOP, coordinate-based
// @match       http://simbad.u-strasbg.fr/simbad/sim-id?Ident=*
//                ^^^ links from SIMBAD in case coordinate-based search has multiple results
// @grant       GM_addStyle
// @noframes
// @version     1.0.3
// @author      -
// @description
// @icon        https://panoptes-uploads.zooniverse.org/production/project_avatar/442e8392-6c46-4481-8ba3-11c6613fba56.jpeg
// ==/UserScript==

(function injectCSS() {
  GM_addStyle(`\
.matched-id {
  font-weight: bold;
  font-size: 110%;
}

.matched-id:before {
  content: "> ";
}

`)
})(); // function injectCSS()


function normalize(aliasText) {
  let res = aliasText.trim();
  if (res.startsWith('TYC')) {
    // for TYC, remove leading zeros, e.g., 123-01234
    res = res.replace(/-0(\d+)/g, '-$1');
  }
  return res;
} // function normalize(..)

// hash come from links from customized ExoFOP


const aliasesMatch = location.hash.match(/aliases=([^&]+)/);
const otherParamsMatch = location.hash.match(/other_params=([^&]+)/);
if (aliasesMatch) {
  const aliases = decodeURIComponent(aliasesMatch[1]);
  const otherParams = otherParamsMatch ? decodeURIComponent(otherParamsMatch[1]) : '';

  document.body.insertAdjacentHTML('beforeend', `\
<div id="tessAliasesCtr" style="background-color:rgba(255,255,0,0.9);
  position: fixed; top: 0px; right: 0px; padding: 0.5em 4ch 0.5em 2ch;
max-width: 15vw;
font-face: monospace; font-size: 90%;
  ">
<u>TESS Aliases:</u> <a href="javascript:void(0);" onclick="this.parentElement.style.display='none';" style="float: right;">[X]</a><br>
<span id="tessAliases">${aliases}</span>
<div id="tessAliasesMatchMsg" style="font-weight: bold;"></div>
<span id="tessOtherParams">${otherParams}</span>
</div>`);


  // Now try to highlight the IDS in the result
  const aliasList = aliases.split(',').map(t => normalize(t));

  let numIdsMatched = 0;

  // highlight the aliases
  // for case the coordinate has multiple results
  console.debug('subject entries', document.querySelectorAll('#datatable tr td:nth-of-type(2) a'));
  Array.from(document.querySelectorAll('#datatable tr td:nth-of-type(2) a'), linkEl => {
    if (aliasList.includes(linkEl.textContent.trim())) {
      const curText = linkEl.textContent;
      linkEl.innerHTML = `<span class="matched-id">${curText}</span>`;
      numIdsMatched++;
    }
    // propagate the aliases to the links of individual result
    linkEl.href += location.hash;
  });

  // case the coordinate matches a single result
  if (document.querySelector('a[name="lab_ident"]')) {
    const idTableEl = document.querySelector('a[name="lab_ident"]').parentElement.nextElementSibling.nextElementSibling.nextElementSibling;
    Array.from(idTableEl.querySelectorAll('tt'), tt => {
      if (aliasList.includes(tt.textContent.trim())) {
        tt.classList.add('matched-id');
        numIdsMatched++;
      }
    });
  }

  if (numIdsMatched > 0) {
    document.querySelector('#tessAliasesMatchMsg').textContent = ` - ${numIdsMatched} IDs matched.`;
  }
}

