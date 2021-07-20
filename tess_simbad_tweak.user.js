// ==UserScript==
// @name        TESS - SIMBAD tweak
// @namespace   astro.tess
// @match       http*://simbad.u-strasbg.fr/simbad/sim-coo?Coord=*
//                ^^^ links generated from ExoFOP, coordinate-based
// @match       http*://simbad.u-strasbg.fr/simbad/sim-id?*
//                ^^^ links from SIMBAD in case coordinate-based search has multiple results
// @grant       GM_addStyle
// @noframes
// @version     1.1.4
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


// BEGIN generic cross match helpers / UI
//

function getMatchingInfoFromHash(aliasFilter = null) {
  const aliasesMatch = location.hash.match(/aliases=([^&]+)/);
  if (!aliasesMatch) {
    return [null, null];
  }

  if (!aliasFilter) {
    aliasFilter = (alias) => true;
  }

  const aliases = decodeURIComponent(aliasesMatch[1]);
  // Now try to highlight the IDS in the result
  const aliasList = aliases.split(',').filter(aliasFilter);

  const otherParamsMatch = location.hash.match(/other_params=([^&]+)/);
  let otherParams = otherParamsMatch ? decodeURIComponent(otherParamsMatch[1]) : '';
  otherParams = annotateOtherParams(otherParams);
  return [aliasList, otherParams];
}

// reset the hash, so that if an user copies the URL, the user won't copy the extra parameters in the hash
// (that would be useless in general)
// use pushState() rather than location.hash = '' so that
// 1) there is no extra hash in the URL
// 2) if there is a need, users could still get the hash back by going back.
function resetMatchingInfoHash() {
  history.pushState("", document.title, location.pathname + location.search);
}

function annotateOtherParams(otherParams) {
  let res = otherParams;

  // convert it to parallax in mas
  // (easier to compare with the value in SIMBAD single result details page)
  const distanceInPc = parseFloat((res.match(/Distance\(pc\):\s*([0-9.]+)/) || ['', '0'])[1]);
  if (distanceInPc > 0) {
    const parallaxInMas = 1000 / distanceInPc;
    res = res.replace(/Distance\(pc\):[^;]+;/, `$& Parallax(mas): ${parallaxInMas.toFixed(4)} ; `);
  }

  // convert apparent magnitude to absolute one
  // (just the first one)
  const magMatch = otherParams.match(/Magnitudes:\s([^-]+-)([0-9.]+)/);
  if (magMatch && distanceInPc > 0) {
    const magBand = magMatch[1];
    const magApparent = parseFloat(magMatch[2]);
    const magAbsolute = magApparent - 5 * Math.log10(distanceInPc / 10);
    res = res.replace(/Magnitudes:[^;]+;/,  `$& Abs. magnitude: ${magBand}${magAbsolute.toFixed(2)} ; `);
  }
  return res;
}

function showMatchingInfo(aliases, otherParams) {
  document.body.insertAdjacentHTML('beforeend', `\
  <div id="tessAliasesCtr" style="background-color:rgba(255,255,0,0.9);
    position: fixed; top: 0px; right: 0px; padding: 0.5em 4ch 0.5em 2ch;
  max-width: 15vw;
  z-index: 99; font-size: 14px; line-height: 1.2;
    ">
  <u>TESS Aliases:</u> <a href="javascript:void(0);" onclick="this.parentElement.style.display='none';" style="float: right;">[X]</a><br>
  <span id="tessAliases">${aliases}</span>
  <div id="tessAliasesMatchMsg" style="font-weight: bold;"></div>
  <span id="tessOtherParams">${otherParams}</span>
  </div>`);
}

//
// END generic cross match helpers / UI


// To normalize the IDs shown in SIMBAD, the textContent of the supplied element, typically an <a>
function normalizeId(idEl) {
  // sometimes the IDs have multiple spaces.
  return idEl.textContent.trim().replace(/\s\s+/g, ' ');
}

// Cross match info in hash, that come from links from customized ExoFOP
function tweakUIWithCrossMatch() {
  const [aliasList, otherParams] = getMatchingInfoFromHash();
  if (!aliasList) {
    return;
  }

  showMatchingInfo(aliasList, otherParams);

  // highlight the aliases
  // for case the coordinate has multiple results

  let numIdsMatched = 0;
  console.debug('subject entries', document.querySelectorAll('#datatable tr td:nth-of-type(2) a'));
  Array.from(document.querySelectorAll('#datatable tr td:nth-of-type(2) a'), linkEl => {
    // propagate the aliases to the links of individual result
    linkEl.href += location.hash;

    if (aliasList.includes(normalizeId(linkEl))) {
      location.href = linkEl.href; // ID matched, go to the individual result page directly
    }
  });

  // case the coordinate matches a single result
  if (document.querySelector('a[name="lab_ident"]')) {
    const idTableEl = document.querySelector('a[name="lab_ident"]').parentElement.nextElementSibling.nextElementSibling.nextElementSibling;
    Array.from(idTableEl.querySelectorAll('tt'), tt => {
      if (aliasList.includes(normalizeId(tt))) {
        tt.classList.add('matched-id');
        numIdsMatched++;
      }
    });
  }

  if (numIdsMatched > 0) {
    document.querySelector('#tessAliasesMatchMsg').textContent = ` - ${numIdsMatched} IDs matched.`;
  }

  resetMatchingInfoHash();
}
tweakUIWithCrossMatch();


// For single result case,
// link star type to wikipedia, if it exists, e.g., link Eclipsing binary in the following:
// TYC 12345-678-9 -- Eclipsing binary
function simbadStarTypeToWikiLinkHtml(starType) {
  function escape(text) {
    const tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return text.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
  }

  // turn <, etc. to html entity for ease of comparison with extracted HTML
  function toKeyEscaped(map) {
    const mapEscaped = {};
    for (const key in map) {
      mapEscaped[escape(key)] = map[key];
    }
    return mapEscaped;
  }

  const NO_LINK = '[NO-LINK]';
  const wikiTitleExceptionsMap = toKeyEscaped({
      // exceptions to be added
      'Star': NO_LINK,
      'Eruptive variable Star': 'Eruptive variable',
      'Eclipsing binary of Algol type': 'Algol variable',
      'Long Period Variable candidate': 'Long Period Variable star',
      'Low-mass star (M<1solMass)': 'Low-mass star',
      'Variable Star of RR Lyr type': 'RR Lyrae variable',
      'Variable of BY Dra type': 'BY Draconis variable',
      'Double or multiple star': 'Double star',
      'Eclipsing binary of W UMa type': 'W Ursae Majoris variable',
      'Variable Star of gamma Dor type': 'Gamma Doradus variable',
      'Brightest galaxy in a Cluster (BCG)': 'Brightest cluster galaxy',
      'Variable Star of delta Sct type': 'Delta Scuti variable',
      'Possible Horizontal Branch Star': 'Horizontal branch',
      'Possible Red supergiant star': 'Red supergiant star',
      'Possible Blue supergiant star': 'Blue supergiant star',
      'Variable Star of beta Cep type': 'Beta Cephei variable',
      'Variable Star of Orion Type': 'Orion variable',
      'CV DQ Her type (intermediate polar)': 'Intermediate polar',
      'CV of AM Her type (polar)': 'Polar (star)',
      'Variable of RS CVn type': 'RS Canum Venaticorum variable',
    });

  // default is starType, and the mapping takes care of special cases
  const wikiTitle = wikiTitleExceptionsMap[starType] || starType;

  return wikiTitle === NO_LINK ? starType :
  `<a target="wiki_star_type"
    href="https://en.wikipedia.org/w/index.php?title=Special:Search&search=${wikiTitle}">${starType}</a>`
}
const startTitleEl = document.querySelector('#basic_data font[size="+2"]');
if (startTitleEl) {
  const reStarIdAndType = /<b>\s*\n*(.+)\s*\n*<\/b>\s*--\s*(.+)/;
  let html = startTitleEl.innerHTML;
  const starIdAndTypeMatch = html.match(reStarIdAndType);
  if (starIdAndTypeMatch) {
    const typeWikiLinkHtml = simbadStarTypeToWikiLinkHtml(starIdAndTypeMatch[2]);
    html = html.replace(reStarIdAndType, `\
<b><a target="wiki_star"
      href="https://en.wikipedia.org/w/index.php?title=Special:Search&search=$1">$1</a></b> --
${typeWikiLinkHtml}
<svg style="height: 0.8em; width: 1em; background: transparent;" aria-hidden="true" data-prefix="fas" data-icon="external-link-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z"></path></svg>
`);
// ^ external indicator svg adapted from ExoFOP
    startTitleEl.innerHTML = html;
  }
}

function highlightInterestingObjectTypes() {
  const uninterestingTypes = (() => {
    const baseTypes = ['*', '**', 'PM*', 'IR', 'UV', 'X', 'G'];
    // include those that aren't uncertain (probably not needed)
    // baseTypes + baseTypes.map(t => t + '?');
    return baseTypes;
  })();

  Array.from(document.querySelectorAll('td > tt[title] > b'), el => {
    const oType = el.textContent.trim();
    if (!uninterestingTypes.includes(oType)) {
      el.style.backgroundColor = "rgba(255, 255, 0, 0.5)";
    }
    el.innerHTML = `\
<a href="/simbad/sim-display?data=otypes#:~:text=${oType}"
   style="color: black;" target="_simbad_otype">${oType}</a>`;
  });
}
highlightInterestingObjectTypes();

function addAladinLiteLink() {
  // recent SIMBAD UI updates take away link to Aladin Lite
  const ctr = document.querySelector('div[name="sendBySAMP"]');
  const targetId = startTitleEl?.querySelector('a')?.textContent;
  if (ctr && targetId) {
    // Set Field of View to 0.1 deg, about 6 arcmin, slightly larger than
    // typical 11x11 pixel TESS TPF (~ 4arcmin)
    ctr.insertAdjacentHTML('afterbegin', `<a
      href="https://aladin.u-strasbg.fr/AladinLite/?target=${encodeURIComponent(targetId)}&fov=0.1"
      target="_aladin_lite">Aladin Lite</a>&emsp;`);
  }
}
addAladinLiteLink();
